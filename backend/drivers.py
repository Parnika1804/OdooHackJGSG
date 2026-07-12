from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import date
from sqlalchemy import text
from database import engine
from rbac import get_current_user, require_role

router = APIRouter(prefix="/drivers", tags=["Drivers"])

VALID_STATUSES = ["Available", "On Trip", "Off Duty", "Suspended"]


# ---------- Schemas ----------
class DriverCreate(BaseModel):
    name: str
    license_number: str
    license_category: str
    license_expiry_date: date
    contact_number: str
    safety_score: Optional[float] = 100
    status: Optional[str] = "Available"


class DriverUpdate(BaseModel):
    name: Optional[str] = None
    license_category: Optional[str] = None
    license_expiry_date: Optional[date] = None
    contact_number: Optional[str] = None
    safety_score: Optional[float] = None
    status: Optional[str] = None


# ---------- Routes ----------

@router.get("")
def get_drivers(user: dict = Depends(get_current_user)):
    """Any authenticated user can view drivers."""
    with engine.connect() as conn:
        result = conn.execute(text("SELECT * FROM drivers ORDER BY id"))
        drivers = [dict(row._mapping) for row in result]
    return {"drivers": drivers}


@router.get("/{driver_id}")
def get_driver(driver_id: int, user: dict = Depends(get_current_user)):
    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT * FROM drivers WHERE id = :id"),
            {"id": driver_id}
        ).fetchone()

    if not result:
        raise HTTPException(status_code=404, detail="Driver not found")

    return dict(result._mapping)


@router.post("")
def create_driver(
    data: DriverCreate,
    user: dict = Depends(require_role("Safety Officer"))
):
    """Only Safety Officer can register a new driver (per RBAC matrix: Safety Officer owns Drivers/Compliance)."""
    if data.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Status must be one of {VALID_STATUSES}")

    with engine.connect() as conn:
        # Check uniqueness of license number
        existing = conn.execute(
            text("SELECT id FROM drivers WHERE license_number = :license_number"),
            {"license_number": data.license_number}
        ).fetchone()

        if existing:
            raise HTTPException(
                status_code=400,
                detail="License number already exists"
            )

        result = conn.execute(
            text("""
                INSERT INTO drivers
                    (name, license_number, license_category, license_expiry_date,
                     contact_number, safety_score, status)
                VALUES
                    (:name, :license_number, :license_category, :license_expiry_date,
                     :contact_number, :safety_score, :status)
                RETURNING *
            """),
            data.dict()
        )
        conn.commit()
        new_driver = result.fetchone()

    return dict(new_driver._mapping)


@router.put("/{driver_id}")
def update_driver(
    driver_id: int,
    data: DriverUpdate,
    user: dict = Depends(require_role("Safety Officer"))
):
    """Only Safety Officer can update a driver (per RBAC matrix)."""
    if data.status and data.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Status must be one of {VALID_STATUSES}")

    update_fields = {k: v for k, v in data.dict().items() if v is not None}

    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields provided to update")

    set_clause = ", ".join([f"{key} = :{key}" for key in update_fields.keys()])
    update_fields["id"] = driver_id

    with engine.connect() as conn:
        existing = conn.execute(
            text("SELECT id FROM drivers WHERE id = :id"),
            {"id": driver_id}
        ).fetchone()

        if not existing:
            raise HTTPException(status_code=404, detail="Driver not found")

        result = conn.execute(
            text(f"UPDATE drivers SET {set_clause} WHERE id = :id RETURNING *"),
            update_fields
        )
        conn.commit()
        updated_driver = result.fetchone()

    return dict(updated_driver._mapping)


@router.delete("/{driver_id}")
def delete_driver(
    driver_id: int,
    user: dict = Depends(require_role("Safety Officer"))
):
    """Only Safety Officer can delete a driver (per RBAC matrix)."""
    with engine.connect() as conn:
        existing = conn.execute(
            text("SELECT id FROM drivers WHERE id = :id"),
            {"id": driver_id}
        ).fetchone()

        if not existing:
            raise HTTPException(status_code=404, detail="Driver not found")

        conn.execute(text("DELETE FROM drivers WHERE id = :id"), {"id": driver_id})
        conn.commit()

    return {"message": f"Driver {driver_id} deleted successfully"}