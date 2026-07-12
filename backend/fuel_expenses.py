from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import date
from sqlalchemy import text
from database import engine
from rbac import get_current_user, require_role

router = APIRouter(tags=["Fuel & Expenses"])


# ---------- Schemas ----------
class FuelLogCreate(BaseModel):
    vehicle_id: int
    trip_id: Optional[int] = None
    liters: float
    cost: float
    log_date: date


class FuelLogUpdate(BaseModel):
    liters: Optional[float] = None
    cost: Optional[float] = None
    log_date: Optional[date] = None


class ExpenseCreate(BaseModel):
    vehicle_id: int
    trip_id: Optional[int] = None
    expense_type: str
    amount: float
    expense_date: date


class ExpenseUpdate(BaseModel):
    expense_type: Optional[str] = None
    amount: Optional[float] = None
    expense_date: Optional[date] = None


# ---------- Fuel Log Routes ----------

@router.get("/fuel-logs")
def get_fuel_logs(user: dict = Depends(get_current_user)):
    with engine.connect() as conn:
        result = conn.execute(text("SELECT * FROM fuel_logs ORDER BY id DESC"))
        logs = [dict(row._mapping) for row in result]
    return {"fuel_logs": logs}


@router.get("/fuel-logs/{log_id}")
def get_fuel_log(log_id: int, user: dict = Depends(get_current_user)):
    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT * FROM fuel_logs WHERE id = :id"), {"id": log_id}
        ).fetchone()
    if not result:
        raise HTTPException(status_code=404, detail="Fuel log not found")
    return dict(result._mapping)


@router.post("/fuel-logs")
def create_fuel_log(
    data: FuelLogCreate,
    user: dict = Depends(require_role("Financial Analyst", "Fleet Manager"))
):
    with engine.connect() as conn:
        vehicle = conn.execute(
            text("SELECT id FROM vehicles WHERE id = :id"), {"id": data.vehicle_id}
        ).fetchone()
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found")

        result = conn.execute(
            text("""
                INSERT INTO fuel_logs (vehicle_id, trip_id, liters, cost, log_date)
                VALUES (:vehicle_id, :trip_id, :liters, :cost, :log_date)
                RETURNING *
            """),
            data.dict()
        )
        conn.commit()
        new_log = result.fetchone()

    return dict(new_log._mapping)


@router.put("/fuel-logs/{log_id}")
def update_fuel_log(
    log_id: int,
    data: FuelLogUpdate,
    user: dict = Depends(require_role("Financial Analyst", "Fleet Manager"))
):
    update_fields = {k: v for k, v in data.dict().items() if v is not None}
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields provided to update")

    with engine.connect() as conn:
        existing = conn.execute(
            text("SELECT id FROM fuel_logs WHERE id = :id"), {"id": log_id}
        ).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Fuel log not found")

        set_clause = ", ".join([f"{k} = :{k}" for k in update_fields.keys()])
        update_fields["id"] = log_id

        result = conn.execute(
            text(f"UPDATE fuel_logs SET {set_clause} WHERE id = :id RETURNING *"),
            update_fields
        )
        conn.commit()
        updated_log = result.fetchone()

    return dict(updated_log._mapping)


@router.delete("/fuel-logs/{log_id}")
def delete_fuel_log(
    log_id: int,
    user: dict = Depends(require_role("Financial Analyst", "Fleet Manager"))
):
    with engine.connect() as conn:
        existing = conn.execute(
            text("SELECT id FROM fuel_logs WHERE id = :id"), {"id": log_id}
        ).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Fuel log not found")

        conn.execute(text("DELETE FROM fuel_logs WHERE id = :id"), {"id": log_id})
        conn.commit()

    return {"message": f"Fuel log {log_id} deleted successfully"}


# ---------- Expense Routes ----------

@router.get("/expenses")
def get_expenses(user: dict = Depends(get_current_user)):
    with engine.connect() as conn:
        result = conn.execute(text("SELECT * FROM expenses ORDER BY id DESC"))
        expenses = [dict(row._mapping) for row in result]
    return {"expenses": expenses}


@router.get("/expenses/{expense_id}")
def get_expense(expense_id: int, user: dict = Depends(get_current_user)):
    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT * FROM expenses WHERE id = :id"), {"id": expense_id}
        ).fetchone()
    if not result:
        raise HTTPException(status_code=404, detail="Expense not found")
    return dict(result._mapping)


@router.post("/expenses")
def create_expense(
    data: ExpenseCreate,
    user: dict = Depends(require_role("Financial Analyst", "Fleet Manager"))
):
    with engine.connect() as conn:
        vehicle = conn.execute(
            text("SELECT id FROM vehicles WHERE id = :id"), {"id": data.vehicle_id}
        ).fetchone()
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found")

        result = conn.execute(
            text("""
                INSERT INTO expenses (vehicle_id, trip_id, expense_type, amount, expense_date)
                VALUES (:vehicle_id, :trip_id, :expense_type, :amount, :expense_date)
                RETURNING *
            """),
            data.dict()
        )
        conn.commit()
        new_expense = result.fetchone()

    return dict(new_expense._mapping)


@router.put("/expenses/{expense_id}")
def update_expense(
    expense_id: int,
    data: ExpenseUpdate,
    user: dict = Depends(require_role("Financial Analyst", "Fleet Manager"))
):
    update_fields = {k: v for k, v in data.dict().items() if v is not None}
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields provided to update")

    with engine.connect() as conn:
        existing = conn.execute(
            text("SELECT id FROM expenses WHERE id = :id"), {"id": expense_id}
        ).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Expense not found")

        set_clause = ", ".join([f"{k} = :{k}" for k in update_fields.keys()])
        update_fields["id"] = expense_id

        result = conn.execute(
            text(f"UPDATE expenses SET {set_clause} WHERE id = :id RETURNING *"),
            update_fields
        )
        conn.commit()
        updated_expense = result.fetchone()

    return dict(updated_expense._mapping)


@router.delete("/expenses/{expense_id}")
def delete_expense(
    expense_id: int,
    user: dict = Depends(require_role("Financial Analyst", "Fleet Manager"))
):
    with engine.connect() as conn:
        existing = conn.execute(
            text("SELECT id FROM expenses WHERE id = :id"), {"id": expense_id}
        ).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Expense not found")

        conn.execute(text("DELETE FROM expenses WHERE id = :id"), {"id": expense_id})
        conn.commit()

    return {"message": f"Expense {expense_id} deleted successfully"}


# ---------- Operational Cost Route ----------

@router.get("/vehicles/{vehicle_id}/operational-cost")
def get_operational_cost(vehicle_id: int, user: dict = Depends(get_current_user)):
    """Returns total operational cost (fuel + maintenance) for a vehicle."""
    with engine.connect() as conn:
        vehicle = conn.execute(
            text("SELECT id, name FROM vehicles WHERE id = :id"), {"id": vehicle_id}
        ).fetchone()
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found")

        fuel_total = conn.execute(
            text("SELECT COALESCE(SUM(cost), 0) AS total FROM fuel_logs WHERE vehicle_id = :id"),
            {"id": vehicle_id}
        ).fetchone().total

        maintenance_total = conn.execute(
            text("SELECT COALESCE(SUM(cost), 0) AS total FROM maintenance_logs WHERE vehicle_id = :id"),
            {"id": vehicle_id}
        ).fetchone().total

        expense_total = conn.execute(
            text("SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE vehicle_id = :id"),
            {"id": vehicle_id}
        ).fetchone().total

    return {
        "vehicle_id": vehicle_id,
        "vehicle_name": vehicle.name,
        "fuel_cost": float(fuel_total),
        "maintenance_cost": float(maintenance_total),
        "other_expenses": float(expense_total),
        "total_operational_cost": float(fuel_total) + float(maintenance_total) + float(expense_total)
    }