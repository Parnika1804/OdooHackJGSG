from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from auth import router as auth_router
from vehicles import router as vehicles_router
from drivers import router as drivers_router
from trips import router as trips_router
from maintenance import router as maintenance_router
app = FastAPI(title="TransitOps API")

# CORS setup first
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers after
app.include_router(auth_router)
app.include_router(vehicles_router)
app.include_router(drivers_router)
app.include_router(trips_router)
app.include_router(maintenance_router)
@app.get("/")
def read_root():
    return {"message": "TransitOps API is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}