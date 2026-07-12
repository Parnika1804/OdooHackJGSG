from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import text
from database import engine
from rbac import get_current_user
import csv
import io

router = APIRouter(prefix="/export", tags=["Export"])


def rows_to_csv(rows, headers):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(headers)
    for row in rows:
        writer.writerow([row._mapping[h] for h in headers])
    output.seek(0)
    return output


@router.get("/vehicles")
def export_vehicles(user: dict = Depends(get_current_user)):
    with engine.connect() as conn:
        result = conn.execute(text("SELECT * FROM vehicles ORDER BY id")).fetchall()

    headers = [
        "id", "registration_number", "name", "type", "max_load_capacity_kg",
        "odometer", "acquisition_cost", "region", "status", "created_at"
    ]
    csv_data = rows_to_csv(result, headers)

    return StreamingResponse(
        csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=vehicles.csv"}
    )


@router.get("/drivers")
def export_drivers(user: dict = Depends(get_current_user)):
    with engine.connect() as conn:
        result = conn.execute(text("SELECT * FROM drivers ORDER BY id")).fetchall()

    headers = [
        "id", "name", "license_number", "license_category", "license_expiry_date",
        "contact_number", "safety_score", "status", "created_at"
    ]
    csv_data = rows_to_csv(result, headers)

    return StreamingResponse(
        csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=drivers.csv"}
    )


@router.get("/trips")
def export_trips(user: dict = Depends(get_current_user)):
    with engine.connect() as conn:
        result = conn.execute(text("SELECT * FROM trips ORDER BY id")).fetchall()

    headers = [
        "id", "source", "destination", "vehicle_id", "driver_id", "cargo_weight_kg",
        "planned_distance_km", "final_odometer", "fuel_consumed_liters", "revenue",
        "status", "created_by", "dispatched_at", "completed_at", "created_at"
    ]
    csv_data = rows_to_csv(result, headers)

    return StreamingResponse(
        csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=trips.csv"}
    )