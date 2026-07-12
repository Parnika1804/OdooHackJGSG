from fastapi import APIRouter, Depends, Query
from typing import Optional
from sqlalchemy import text
from database import engine
from rbac import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/kpis")
def get_dashboard_kpis(
    vehicle_type: Optional[str] = Query(None, description="Filter by vehicle type, e.g. Van, Truck, Mini"),
    status: Optional[str] = Query(None, description="Filter vehicles by status"),
    region: Optional[str] = Query(None, description="Filter vehicles by region"),
    user: dict = Depends(get_current_user)
):
    """Returns dashboard KPIs, optionally filtered by vehicle type/status/region."""

    filters = []
    params = {}

    if vehicle_type:
        filters.append("type = :vehicle_type")
        params["vehicle_type"] = vehicle_type
    if status:
        filters.append("status = :status")
        params["status"] = status
    if region:
        filters.append("region = :region")
        params["region"] = region

    where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""

    with engine.connect() as conn:
        # Total vehicles matching filter (for utilization % denominator)
        total_vehicles = conn.execute(
            text(f"SELECT COUNT(*) AS count FROM vehicles {where_clause}"),
            params
        ).fetchone().count

        # Active vehicles = not Retired
        active_filters = filters + ["status != 'Retired'"] if filters else ["status != 'Retired'"]
        active_where = f"WHERE {' AND '.join(active_filters)}"
        active_vehicles = conn.execute(
            text(f"SELECT COUNT(*) AS count FROM vehicles {active_where}"),
            params
        ).fetchone().count

        # Available vehicles
        avail_filters = filters + ["status = 'Available'"] if filters else ["status = 'Available'"]
        avail_where = f"WHERE {' AND '.join(avail_filters)}"
        available_vehicles = conn.execute(
            text(f"SELECT COUNT(*) AS count FROM vehicles {avail_where}"),
            params
        ).fetchone().count

        # In-maintenance (In Shop) vehicles
        shop_filters = filters + ["status = 'In Shop'"] if filters else ["status = 'In Shop'"]
        shop_where = f"WHERE {' AND '.join(shop_filters)}"
        in_maintenance_vehicles = conn.execute(
            text(f"SELECT COUNT(*) AS count FROM vehicles {shop_where}"),
            params
        ).fetchone().count

        # On Trip vehicles (used for utilization %)
        on_trip_filters = filters + ["status = 'On Trip'"] if filters else ["status = 'On Trip'"]
        on_trip_where = f"WHERE {' AND '.join(on_trip_filters)}"
        on_trip_vehicles = conn.execute(
            text(f"SELECT COUNT(*) AS count FROM vehicles {on_trip_where}"),
            params
        ).fetchone().count

        # Active trips (Dispatched)
        active_trips = conn.execute(
            text("SELECT COUNT(*) AS count FROM trips WHERE status = 'Dispatched'")
        ).fetchone().count

        # Pending trips (Draft)
        pending_trips = conn.execute(
            text("SELECT COUNT(*) AS count FROM trips WHERE status = 'Draft'")
        ).fetchone().count

        # Drivers on duty (On Trip status)
        drivers_on_duty = conn.execute(
            text("SELECT COUNT(*) AS count FROM drivers WHERE status = 'On Trip'")
        ).fetchone().count

        # Recent trips (last 5, joined with vehicle/driver names)
        recent_trips = conn.execute(
            text("""
                SELECT t.id, v.name AS vehicle_name, d.name AS driver_name, t.status,
                       t.source, t.destination, t.created_at
                FROM trips t
                LEFT JOIN vehicles v ON t.vehicle_id = v.id
                LEFT JOIN drivers d ON t.driver_id = d.id
                ORDER BY t.created_at DESC
                LIMIT 5
            """)
        ).fetchall()
        recent_trips = [dict(row._mapping) for row in recent_trips]

    fleet_utilization = round((on_trip_vehicles / total_vehicles * 100), 1) if total_vehicles > 0 else 0

    return {
        "active_vehicles": active_vehicles,
        "available_vehicles": available_vehicles,
        "in_maintenance_vehicles": in_maintenance_vehicles,
        "on_trip_vehicles": on_trip_vehicles,
        "active_trips": active_trips,
        "pending_trips": pending_trips,
        "drivers_on_duty": drivers_on_duty,
        "fleet_utilization_percent": fleet_utilization,
        "recent_trips": recent_trips
    }