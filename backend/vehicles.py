from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy import text
from database import engine
from rbac import get_current_user, require_role
import uuid
from fastapi import UploadFile, File, Form
from storage import supabase, DOCUMENTS_BUCKET

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
@router.post("/{vehicle_id}/documents")
def upload_vehicle_document(
    vehicle_id: int,
    doc_type: str = Form(...),
    file: UploadFile = File(...),
    user: dict = Depends(require_role("Fleet Manager"))
):
    """Only Fleet Manager can upload vehicle documents (RC, insurance, permit, etc.)."""
    with engine.connect() as conn:
        vehicle = conn.execute(
            text("SELECT id FROM vehicles WHERE id = :id"),
            {"id": vehicle_id}
        ).fetchone()
 
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
 
    file_bytes = file.file.read()
    ext = file.filename.split(".")[-1] if "." in file.filename else "bin"
    storage_path = f"{vehicle_id}/{uuid.uuid4()}.{ext}"
 
    try:
        supabase.storage.from_(DOCUMENTS_BUCKET).upload(
            storage_path, file_bytes,
            {"content-type": file.content_type or "application/octet-stream"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
 
    file_url = supabase.storage.from_(DOCUMENTS_BUCKET).get_public_url(storage_path)
 
    with engine.connect() as conn:
        result = conn.execute(
            text("""
                INSERT INTO vehicle_documents (vehicle_id, doc_type, file_url)
                VALUES (:vehicle_id, :doc_type, :file_url)
                RETURNING *
            """),
            {"vehicle_id": vehicle_id, "doc_type": doc_type, "file_url": file_url}
        )
        conn.commit()
        new_doc = result.fetchone()
 
    return dict(new_doc._mapping)
 
 
@router.get("/{vehicle_id}/documents")
def get_vehicle_documents(vehicle_id: int, user: dict = Depends(get_current_user)):
    """Any authenticated user can view a vehicle's documents."""
    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT * FROM vehicle_documents WHERE vehicle_id = :vehicle_id ORDER BY uploaded_at DESC"),
            {"vehicle_id": vehicle_id}
        )
        documents = [dict(row._mapping) for row in result]
 
    return {"documents": documents}
 
 
@router.delete("/{vehicle_id}/documents/{doc_id}")
def delete_vehicle_document(
    vehicle_id: int,
    doc_id: int,
    user: dict = Depends(require_role("Fleet Manager"))
):
    """Only Fleet Manager can delete vehicle documents."""
    with engine.connect() as conn:
        doc = conn.execute(
            text("SELECT * FROM vehicle_documents WHERE id = :id AND vehicle_id = :vehicle_id"),
            {"id": doc_id, "vehicle_id": vehicle_id}
        ).fetchone()
 
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
 
    file_url = doc._mapping["file_url"]
    storage_path = file_url.split(f"{DOCUMENTS_BUCKET}/")[-1]
 
    try:
        supabase.storage.from_(DOCUMENTS_BUCKET).remove([storage_path])
    except Exception:
        pass  # file may already be gone from storage; still clean up the DB row
 
    with engine.connect() as conn:
        conn.execute(text("DELETE FROM vehicle_documents WHERE id = :id"), {"id": doc_id})
        conn.commit()
 
    return {"message": f"Document {doc_id} deleted successfully"}