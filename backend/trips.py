from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import date
from sqlalchemy import text
from database import engine
from rbac import get_current_user, require_role

router = APIRouter(prefix="/trips", tags=["Trips"])

VALID_STATUSES = ["Draft", "Dispatched", "Completed", "Cancelled"]


# ---------- Schemas ----------
class TripCreate(BaseModel):
    source: str
    destination: str
    vehicle_id: Optional[int] = None
    driver_id: Optional[int] = None
    cargo_weight_kg: float
    planned_distance_km: float


class TripUpdate(BaseModel):
    source: Optional[str] = None
    destination: Optional[str] = None
    vehicle_id: Optional[int] = None
    driver_id: Optional[int] = None
    cargo_weight_kg: Optional[float] = None
    planned_distance_km: Optional[float] = None


# ---------- Routes ----------

@router.get("")
def get_trips(user: dict = Depends(get_current_user)):
    with engine.connect() as conn:
        result = conn.execute(text("SELECT * FROM trips ORDER BY id"))
        trips = [dict(row._mapping) for row in result]
    return {"trips": trips}


@router.get("/{trip_id}")
def get_trip(trip_id: int, user: dict = Depends(get_current_user)):
    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT * FROM trips WHERE id = :id"),
            {"id": trip_id}
        ).fetchone()

    if not result:
        raise HTTPException(status_code=404, detail="Trip not found")

    return dict(result._mapping)


@router.post("")
def create_trip(
    data: TripCreate,
    user: dict = Depends(require_role("Fleet Manager", "Dispatcher"))
):
    """Create a trip in Draft status. Validates vehicle/driver availability, capacity, and driver eligibility."""
    with engine.connect() as conn:
        vehicle = None
        driver = None

        # ---- Vehicle checks ----
        if data.vehicle_id is not None:
            vehicle = conn.execute(
                text("SELECT * FROM vehicles WHERE id = :id"),
                {"id": data.vehicle_id}
            ).fetchone()

            if not vehicle:
                raise HTTPException(status_code=404, detail="Vehicle not found")

            if vehicle.status in ("Retired", "In Shop"):
                raise HTTPException(
                    status_code=400,
                    detail=f"Vehicle is {vehicle.status} and unavailable for dispatch"
                )

            if vehicle.status == "On Trip":
                raise HTTPException(
                    status_code=400,
                    detail="Vehicle is already assigned to an active trip"
                )

            if data.cargo_weight_kg > float(vehicle.max_load_capacity_kg):
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Cargo weight {data.cargo_weight_kg}kg exceeds vehicle capacity "
                        f"{vehicle.max_load_capacity_kg}kg"
                    )
                )

        # ---- Driver checks ----
        if data.driver_id is not None:
            driver = conn.execute(
                text("SELECT * FROM drivers WHERE id = :id"),
                {"id": data.driver_id}
            ).fetchone()

            if not driver:
                raise HTTPException(status_code=404, detail="Driver not found")

            if driver.status == "Suspended":
                raise HTTPException(
                    status_code=400,
                    detail="Driver is Suspended and cannot be assigned"
                )

            if driver.status == "On Trip":
                raise HTTPException(
                    status_code=400,
                    detail="Driver is already assigned to an active trip"
                )

            if driver.license_expiry_date < date.today():
                raise HTTPException(
                    status_code=400,
                    detail="Driver's license has expired and cannot be assigned"
                )

        result = conn.execute(
            text("""
                INSERT INTO trips
                    (source, destination, vehicle_id, driver_id,
                     cargo_weight_kg, planned_distance_km, status, created_by)
                VALUES
                    (:source, :destination, :vehicle_id, :driver_id,
                     :cargo_weight_kg, :planned_distance_km, 'Draft', :created_by)
                RETURNING *
            """),
            {
                **data.dict(),
                "created_by": user["id"]
            }
        )
        conn.commit()
        new_trip = result.fetchone()

    return dict(new_trip._mapping)


@router.put("/{trip_id}")
def update_trip(
    trip_id: int,
    data: TripUpdate,
    user: dict = Depends(require_role("Fleet Manager", "Dispatcher"))
):
    """Update a Draft trip's details (source, destination, vehicle, driver, cargo, distance)."""
    update_fields = {k: v for k, v in data.dict().items() if v is not None}

    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields provided to update")

    with engine.connect() as conn:
        trip = conn.execute(
            text("SELECT * FROM trips WHERE id = :id"),
            {"id": trip_id}
        ).fetchone()

        if not trip:
            raise HTTPException(status_code=404, detail="Trip not found")

        if trip.status != "Draft":
            raise HTTPException(
                status_code=400,
                detail="Only Draft trips can be edited"
            )

        # Re-validate vehicle if being changed
        vehicle_id = update_fields.get("vehicle_id", trip.vehicle_id)
        cargo_weight_kg = update_fields.get("cargo_weight_kg", trip.cargo_weight_kg)

        if vehicle_id is not None:
            vehicle = conn.execute(
                text("SELECT * FROM vehicles WHERE id = :id"),
                {"id": vehicle_id}
            ).fetchone()

            if not vehicle:
                raise HTTPException(status_code=404, detail="Vehicle not found")

            if vehicle.status in ("Retired", "In Shop"):
                raise HTTPException(status_code=400, detail=f"Vehicle is {vehicle.status}")

            if vehicle.status == "On Trip" and vehicle.id != trip.vehicle_id:
                raise HTTPException(status_code=400, detail="Vehicle is already assigned to an active trip")

            if float(cargo_weight_kg) > float(vehicle.max_load_capacity_kg):
                raise HTTPException(
                    status_code=400,
                    detail=f"Cargo weight exceeds vehicle capacity {vehicle.max_load_capacity_kg}kg"
                )

        # Re-validate driver if being changed
        driver_id = update_fields.get("driver_id", trip.driver_id)
        if driver_id is not None:
            driver = conn.execute(
                text("SELECT * FROM drivers WHERE id = :id"),
                {"id": driver_id}
            ).fetchone()

            if not driver:
                raise HTTPException(status_code=404, detail="Driver not found")

            if driver.status == "Suspended":
                raise HTTPException(status_code=400, detail="Driver is Suspended")

            if driver.status == "On Trip" and driver.id != trip.driver_id:
                raise HTTPException(status_code=400, detail="Driver is already assigned to an active trip")

            if driver.license_expiry_date < date.today():
                raise HTTPException(status_code=400, detail="Driver's license has expired")

        set_clause = ", ".join([f"{key} = :{key}" for key in update_fields.keys()])
        update_fields["id"] = trip_id

        result = conn.execute(
            text(f"UPDATE trips SET {set_clause} WHERE id = :id RETURNING *"),
            update_fields
        )
        conn.commit()
        updated_trip = result.fetchone()

    return dict(updated_trip._mapping)


@router.delete("/{trip_id}")
def delete_trip(
    trip_id: int,
    user: dict = Depends(require_role("Fleet Manager"))
):
    with engine.connect() as conn:
        existing = conn.execute(
            text("SELECT id FROM trips WHERE id = :id"),
            {"id": trip_id}
        ).fetchone()

        if not existing:
            raise HTTPException(status_code=404, detail="Trip not found")

        conn.execute(text("DELETE FROM trips WHERE id = :id"), {"id": trip_id})
        conn.commit()

    return {"message": f"Trip {trip_id} deleted successfully"}
from pydantic import BaseModel
from typing import Optional


# ---------- Additional Schemas ----------
class TripComplete(BaseModel):
    final_odometer: float
    fuel_consumed_liters: float
    revenue: Optional[float] = 0


# ---------- Status Transition Routes ----------

@router.patch("/{trip_id}/dispatch")
def dispatch_trip(
    trip_id: int,
    user: dict = Depends(require_role("Fleet Manager", "Dispatcher"))
):
    """Move trip from Draft to Dispatched. Sets vehicle+driver status to On Trip."""
    with engine.connect() as conn:
        trip = conn.execute(
            text("SELECT * FROM trips WHERE id = :id"),
            {"id": trip_id}
        ).fetchone()

        if not trip:
            raise HTTPException(status_code=404, detail="Trip not found")

        if trip.status != "Draft":
            raise HTTPException(
                status_code=400,
                detail=f"Only Draft trips can be dispatched (current status: {trip.status})"
            )

        if not trip.vehicle_id or not trip.driver_id:
            raise HTTPException(
                status_code=400,
                detail="Trip must have both a vehicle and driver assigned before dispatch"
            )

        # Re-check vehicle/driver are still valid at dispatch time
        vehicle = conn.execute(
            text("SELECT * FROM vehicles WHERE id = :id"),
            {"id": trip.vehicle_id}
        ).fetchone()
        driver = conn.execute(
            text("SELECT * FROM drivers WHERE id = :id"),
            {"id": trip.driver_id}
        ).fetchone()

        if vehicle.status in ("Retired", "In Shop", "On Trip"):
            raise HTTPException(status_code=400, detail=f"Vehicle is {vehicle.status}, cannot dispatch")

        if driver.status in ("Suspended", "On Trip"):
            raise HTTPException(status_code=400, detail=f"Driver is {driver.status}, cannot dispatch")

        from datetime import date
        if driver.license_expiry_date < date.today():
            raise HTTPException(status_code=400, detail="Driver's license has expired")

        # Update trip status
        result = conn.execute(
            text("""
                UPDATE trips
                SET status = 'Dispatched', dispatched_at = NOW()
                WHERE id = :id
                RETURNING *
            """),
            {"id": trip_id}
        )
        updated_trip = result.fetchone()

        # Update vehicle and driver status to On Trip
        conn.execute(
            text("UPDATE vehicles SET status = 'On Trip' WHERE id = :id"),
            {"id": trip.vehicle_id}
        )
        conn.execute(
            text("UPDATE drivers SET status = 'On Trip' WHERE id = :id"),
            {"id": trip.driver_id}
        )
        conn.commit()

    return dict(updated_trip._mapping)


@router.patch("/{trip_id}/complete")
def complete_trip(
    trip_id: int,
    data: TripComplete,
    user: dict = Depends(require_role("Fleet Manager", "Dispatcher"))
):
    """Move trip from Dispatched to Completed. Captures final odometer + fuel, sets vehicle+driver to Available."""
    with engine.connect() as conn:
        trip = conn.execute(
            text("SELECT * FROM trips WHERE id = :id"),
            {"id": trip_id}
        ).fetchone()

        if not trip:
            raise HTTPException(status_code=404, detail="Trip not found")

        if trip.status != "Dispatched":
            raise HTTPException(
                status_code=400,
                detail=f"Only Dispatched trips can be completed (current status: {trip.status})"
            )

        result = conn.execute(
            text("""
                UPDATE trips
                SET status = 'Completed',
                    final_odometer = :final_odometer,
                    fuel_consumed_liters = :fuel_consumed_liters,
                    revenue = :revenue,
                    completed_at = NOW()
                WHERE id = :id
                RETURNING *
            """),
            {
                "id": trip_id,
                "final_odometer": data.final_odometer,
                "fuel_consumed_liters": data.fuel_consumed_liters,
                "revenue": data.revenue
            }
        )
        updated_trip = result.fetchone()

        # Update vehicle odometer + status back to Available
        conn.execute(
            text("""
                UPDATE vehicles
                SET status = 'Available', odometer = :final_odometer
                WHERE id = :id
            """),
            {"id": trip.vehicle_id, "final_odometer": data.final_odometer}
        )
        # Driver back to Available
        conn.execute(
            text("UPDATE drivers SET status = 'Available' WHERE id = :id"),
            {"id": trip.driver_id}
        )
        conn.commit()

    return dict(updated_trip._mapping)


@router.patch("/{trip_id}/cancel")
def cancel_trip(
    trip_id: int,
    user: dict = Depends(require_role("Fleet Manager", "Dispatcher"))
):
    """Cancel a trip. Restores vehicle+driver status to Available (if they were On Trip)."""
    with engine.connect() as conn:
        trip = conn.execute(
            text("SELECT * FROM trips WHERE id = :id"),
            {"id": trip_id}
        ).fetchone()

        if not trip:
            raise HTTPException(status_code=404, detail="Trip not found")

        if trip.status in ("Completed", "Cancelled"):
            raise HTTPException(
                status_code=400,
                detail=f"Cannot cancel a trip that is already {trip.status}"
            )

        result = conn.execute(
            text("""
                UPDATE trips
                SET status = 'Cancelled'
                WHERE id = :id
                RETURNING *
            """),
            {"id": trip_id}
        )
        updated_trip = result.fetchone()

        # Restore vehicle + driver to Available if they were On Trip
        if trip.vehicle_id:
            conn.execute(
                text("""
                    UPDATE vehicles SET status = 'Available'
                    WHERE id = :id AND status = 'On Trip'
                """),
                {"id": trip.vehicle_id}
            )
        if trip.driver_id:
            conn.execute(
                text("""
                    UPDATE drivers SET status = 'Available'
                    WHERE id = :id AND status = 'On Trip'
                """),
                {"id": trip.driver_id}
            )
        conn.commit()

    return dict(updated_trip._mapping)