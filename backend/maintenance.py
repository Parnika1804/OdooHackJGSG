from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import date
from sqlalchemy import text
from database import engine
from rbac import get_current_user, require_role

router = APIRouter(prefix="/maintenance", tags=["Maintenance"])

VALID_STATUSES = ["In Shop", "Completed"]


# ---------- Schemas ----------
class MaintenanceCreate(BaseModel):
    vehicle_id: int
    service_type: str
    cost: Optional[float] = 0
    service_date: date


class MaintenanceUpdate(BaseModel):
    service_type: Optional[str] = None
    cost: Optional[float] = None
    service_date: Optional[date] = None
    status: Optional[str] = None


# ---------- Routes ----------

@router.get("")
def get_maintenance_logs(user: dict = Depends(get_current_user)):
    with engine.connect() as conn:
        result = conn.execute(text("SELECT * FROM maintenance_logs ORDER BY id DESC"))
        logs = [dict(row._mapping) for row in result]
    return {"maintenance_logs": logs}


@router.get("/{log_id}")
def get_maintenance_log(log_id: int, user: dict = Depends(get_current_user)):
    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT * FROM maintenance_logs WHERE id = :id"),
            {"id": log_id}
        ).fetchone()

    if not result:
        raise HTTPException(status_code=404, detail="Maintenance log not found")

    return dict(result._mapping)


@router.post("")
def create_maintenance_log(
    data: MaintenanceCreate,
    user: dict = Depends(require_role("Fleet Manager"))
):
    """Log a new service record. Sets vehicle status to In Shop and blocks it from dispatch."""
    with engine.connect() as conn:
        vehicle = conn.execute(
            text("SELECT * FROM vehicles WHERE id = :id"),
            {"id": data.vehicle_id}
        ).fetchone()

        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found")

        if vehicle.status == "On Trip":
            raise HTTPException(
                status_code=400,
                detail="Vehicle is currently On Trip and cannot be sent to maintenance"
            )

        if vehicle.status == "Retired":
            raise HTTPException(
                status_code=400,
                detail="Vehicle is Retired and cannot be serviced"
            )

        result = conn.execute(
            text("""
                INSERT INTO maintenance_logs
                    (vehicle_id, service_type, cost, service_date, status)
                VALUES
                    (:vehicle_id, :service_type, :cost, :service_date, 'In Shop')
                RETURNING *
            """),
            data.dict()
        )
        new_log = result.fetchone()

        # Set vehicle to In Shop
        conn.execute(
            text("UPDATE vehicles SET status = 'In Shop' WHERE id = :id"),
            {"id": data.vehicle_id}
        )
        conn.commit()

    return dict(new_log._mapping)


@router.put("/{log_id}")
def update_maintenance_log(
    log_id: int,
    data: MaintenanceUpdate,
    user: dict = Depends(require_role("Fleet Manager"))
):
    """Update a maintenance log. Closing it (status -> Completed) sets vehicle back to Available,
    unless the vehicle was separately marked Retired."""
    if data.status and data.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Status must be one of {VALID_STATUSES}")

    update_fields = {k: v for k, v in data.dict().items() if v is not None}

    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields provided to update")

    with engine.connect() as conn:
        log = conn.execute(
            text("SELECT * FROM maintenance_logs WHERE id = :id"),
            {"id": log_id}
        ).fetchone()

        if not log:
            raise HTTPException(status_code=404, detail="Maintenance log not found")

        set_clause = ", ".join([f"{key} = :{key}" for key in update_fields.keys()])
        update_fields["id"] = log_id

        result = conn.execute(
            text(f"UPDATE maintenance_logs SET {set_clause} WHERE id = :id RETURNING *"),
            update_fields
        )
        updated_log = result.fetchone()

        # If closing the log (status -> Completed), restore vehicle to Available
        # unless the vehicle has separately been marked Retired
        if update_fields.get("status") == "Completed":
            vehicle = conn.execute(
                text("SELECT * FROM vehicles WHERE id = :id"),
                {"id": log.vehicle_id}
            ).fetchone()

            if vehicle and vehicle.status != "Retired":
                conn.execute(
                    text("UPDATE vehicles SET status = 'Available' WHERE id = :id"),
                    {"id": log.vehicle_id}
                )

        conn.commit()

    return dict(updated_log._mapping)


@router.delete("/{log_id}")
def delete_maintenance_log(
    log_id: int,
    user: dict = Depends(require_role("Fleet Manager"))
):
    with engine.connect() as conn:
        existing = conn.execute(
            text("SELECT id FROM maintenance_logs WHERE id = :id"),
            {"id": log_id}
        ).fetchone()

        if not existing:
            raise HTTPException(status_code=404, detail="Maintenance log not found")

        conn.execute(text("DELETE FROM maintenance_logs WHERE id = :id"), {"id": log_id})
        conn.commit()

    return {"message": f"Maintenance log {log_id} deleted successfully"}