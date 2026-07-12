from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy import text
from database import engine
from rbac import get_current_user, require_role

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])

VALID_STATUSES = ["Available", "On Trip", "In Shop", "Retired"]


# ---------- Schemas ----------
class VehicleCreate(BaseModel):
    registration_number: str
    name: str
    type: str
    max_load_capacity_kg: float
    odometer: Optional[float] = 0
    acquisition_cost: float
    region: Optional[str] = None
    status: Optional[str] = "Available"


class VehicleUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    max_load_capacity_kg: Optional[float] = None
    odometer: Optional[float] = None
    acquisition_cost: Optional[float] = None
    region: Optional[str] = None
    status: Optional[str] = None


# ---------- Routes ----------

@router.get("")
def get_vehicles(user: dict = Depends(get_current_user)):
    """Any authenticated user can view vehicles."""
    with engine.connect() as conn:
        result = conn.execute(text("SELECT * FROM vehicles ORDER BY id"))
        vehicles = [dict(row._mapping) for row in result]
    return {"vehicles": vehicles}


@router.get("/{vehicle_id}")
def get_vehicle(vehicle_id: int, user: dict = Depends(get_current_user)):
    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT * FROM vehicles WHERE id = :id"),
            {"id": vehicle_id}
        ).fetchone()

    if not result:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    return dict(result._mapping)


@router.post("")
def create_vehicle(
    data: VehicleCreate,
    user: dict = Depends(require_role("Fleet Manager"))
):
    """Only Fleet Manager can register a new vehicle."""
    if data.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Status must be one of {VALID_STATUSES}")

    with engine.connect() as conn:
        # Check uniqueness of registration number
        existing = conn.execute(
            text("SELECT id FROM vehicles WHERE registration_number = :reg"),
            {"reg": data.registration_number}
        ).fetchone()

        if existing:
            raise HTTPException(
                status_code=400,
                detail="Registration number already exists"
            )

        result = conn.execute(
            text("""
                INSERT INTO vehicles
                    (registration_number, name, type, max_load_capacity_kg,
                     odometer, acquisition_cost, region, status)
                VALUES
                    (:registration_number, :name, :type, :max_load_capacity_kg,
                     :odometer, :acquisition_cost, :region, :status)
                RETURNING *
            """),
            data.dict()
        )
        conn.commit()
        new_vehicle = result.fetchone()

    return dict(new_vehicle._mapping)


@router.put("/{vehicle_id}")
def update_vehicle(
    vehicle_id: int,
    data: VehicleUpdate,
    user: dict = Depends(require_role("Fleet Manager"))
):
    """Only Fleet Manager can update a vehicle."""
    if data.status and data.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Status must be one of {VALID_STATUSES}")

    update_fields = {k: v for k, v in data.dict().items() if v is not None}

    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields provided to update")

    set_clause = ", ".join([f"{key} = :{key}" for key in update_fields.keys()])
    update_fields["id"] = vehicle_id

    with engine.connect() as conn:
        existing = conn.execute(
            text("SELECT id FROM vehicles WHERE id = :id"),
            {"id": vehicle_id}
        ).fetchone()

        if not existing:
            raise HTTPException(status_code=404, detail="Vehicle not found")

        result = conn.execute(
            text(f"UPDATE vehicles SET {set_clause} WHERE id = :id RETURNING *"),
            update_fields
        )
        conn.commit()
        updated_vehicle = result.fetchone()

    return dict(updated_vehicle._mapping)


@router.delete("/{vehicle_id}")
def delete_vehicle(
    vehicle_id: int,
    user: dict = Depends(require_role("Fleet Manager"))
):
    """Only Fleet Manager can delete a vehicle."""
    with engine.connect() as conn:
        existing = conn.execute(
            text("SELECT id FROM vehicles WHERE id = :id"),
            {"id": vehicle_id}
        ).fetchone()

        if not existing:
            raise HTTPException(status_code=404, detail="Vehicle not found")

        conn.execute(text("DELETE FROM vehicles WHERE id = :id"), {"id": vehicle_id})
        conn.commit()

    return {"message": f"Vehicle {vehicle_id} deleted successfully"}