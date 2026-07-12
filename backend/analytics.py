from fastapi import APIRouter, Depends
from sqlalchemy import text
from database import engine
from rbac import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/summary")
def get_analytics_summary(user: dict = Depends(get_current_user)):
    """Returns fuel efficiency, fleet utilization, operational cost, and vehicle ROI KPIs."""
    with engine.connect() as conn:
        # Fuel efficiency: total distance / total fuel consumed across completed trips
        fuel_eff_row = conn.execute(
            text("""
                SELECT
                    COALESCE(SUM(planned_distance_km), 0) AS total_distance,
                    COALESCE(SUM(fuel_consumed_liters), 0) AS total_fuel
                FROM trips
                WHERE status = 'Completed' AND fuel_consumed_liters > 0
            """)
        ).fetchone()

        fuel_efficiency = (
            round(fuel_eff_row.total_distance / fuel_eff_row.total_fuel, 1)
            if fuel_eff_row.total_fuel > 0 else 0
        )

        # Fleet utilization: On Trip vehicles / total non-retired vehicles
        util_row = conn.execute(
            text("""
                SELECT
                    COUNT(*) FILTER (WHERE status = 'On Trip') AS on_trip,
                    COUNT(*) FILTER (WHERE status != 'Retired') AS active_total
                FROM vehicles
            """)
        ).fetchone()

        fleet_utilization = (
            round(util_row.on_trip / util_row.active_total * 100, 1)
            if util_row.active_total > 0 else 0
        )

        # Operational cost: fuel + maintenance + expenses, all vehicles combined
        fuel_cost = conn.execute(
            text("SELECT COALESCE(SUM(cost), 0) AS total FROM fuel_logs")
        ).fetchone().total

        maintenance_cost = conn.execute(
            text("SELECT COALESCE(SUM(cost), 0) AS total FROM maintenance_logs")
        ).fetchone().total

        expense_cost = conn.execute(
            text("SELECT COALESCE(SUM(amount), 0) AS total FROM expenses")
        ).fetchone().total

        total_operational_cost = float(fuel_cost) + float(maintenance_cost) + float(expense_cost)

        # Vehicle ROI: (total revenue - total operational cost) / total acquisition cost
        revenue_row = conn.execute(
            text("SELECT COALESCE(SUM(revenue), 0) AS total FROM trips WHERE status = 'Completed'")
        ).fetchone()
        total_revenue = float(revenue_row.total)

        acquisition_row = conn.execute(
            text("SELECT COALESCE(SUM(acquisition_cost), 0) AS total FROM vehicles")
        ).fetchone()
        total_acquisition_cost = float(acquisition_row.total)

        vehicle_roi = (
            round((total_revenue - total_operational_cost) / total_acquisition_cost * 100, 1)
            if total_acquisition_cost > 0 else 0
        )

    return {
        "fuel_efficiency_km_per_liter": fuel_efficiency,
        "fleet_utilization_percent": fleet_utilization,
        "operational_cost": total_operational_cost,
        "vehicle_roi_percent": vehicle_roi
    }


@router.get("/monthly-revenue")
def get_monthly_revenue(user: dict = Depends(get_current_user)):
    """Returns total revenue grouped by month, from Completed trips."""
    with engine.connect() as conn:
        result = conn.execute(
            text("""
                SELECT
                    TO_CHAR(completed_at, 'YYYY-MM') AS month,
                    COALESCE(SUM(revenue), 0) AS total_revenue
                FROM trips
                WHERE status = 'Completed' AND completed_at IS NOT NULL
                GROUP BY TO_CHAR(completed_at, 'YYYY-MM')
                ORDER BY month
            """)
        ).fetchall()

    return {
        "monthly_revenue": [
            {"month": row.month, "revenue": float(row.total_revenue)} for row in result
        ]
    }


@router.get("/top-costliest-vehicles")
def get_top_costliest_vehicles(limit: int = 5, user: dict = Depends(get_current_user)):
    """Returns vehicles ranked by total cost (fuel + maintenance + expenses)."""
    with engine.connect() as conn:
        result = conn.execute(
            text("""
                SELECT
                    v.id,
                    v.name,
                    COALESCE(f.fuel_total, 0) AS fuel_cost,
                    COALESCE(m.maintenance_total, 0) AS maintenance_cost,
                    COALESCE(e.expense_total, 0) AS other_expenses,
                    COALESCE(f.fuel_total, 0) + COALESCE(m.maintenance_total, 0) + COALESCE(e.expense_total, 0) AS total_cost
                FROM vehicles v
                LEFT JOIN (
                    SELECT vehicle_id, SUM(cost) AS fuel_total FROM fuel_logs GROUP BY vehicle_id
                ) f ON v.id = f.vehicle_id
                LEFT JOIN (
                    SELECT vehicle_id, SUM(cost) AS maintenance_total FROM maintenance_logs GROUP BY vehicle_id
                ) m ON v.id = m.vehicle_id
                LEFT JOIN (
                    SELECT vehicle_id, SUM(amount) AS expense_total FROM expenses GROUP BY vehicle_id
                ) e ON v.id = e.vehicle_id
                ORDER BY total_cost DESC
                LIMIT :limit
            """),
            {"limit": limit}
        ).fetchall()

    return {
        "top_costliest_vehicles": [
            {
                "vehicle_id": row.id,
                "name": row.name,
                "fuel_cost": float(row.fuel_cost),
                "maintenance_cost": float(row.maintenance_cost),
                "other_expenses": float(row.other_expenses),
                "total_cost": float(row.total_cost)
            }
            for row in result
        ]
    }