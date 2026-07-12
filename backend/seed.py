"""
TransitOps demo data seeder.

Populates vehicles, drivers, trips, maintenance_logs, fuel_logs, expenses
to roughly match the mockup KPI numbers:
  Active Vehicles: 53 | Available: 42 | In Maintenance: 5 | Active Trips: 18
  Pending Trips: 9    | Drivers On Duty: 26

NOTE: users table is intentionally NOT seeded here. password_hash must match
your backend's hashing scheme (likely passlib/bcrypt) — sign up your 4 demo
role accounts through the normal /signup flow instead.

Usage:
    cd backend
    python seed.py
"""

from sqlalchemy import create_engine, text
from dotenv import load_dotenv
from datetime import date, timedelta
import os
import random

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

random.seed(42)  # reproducible runs

REGIONS = ["Gandhinagar", "Ahmedabad", "Vadodara", "Surat", "Rajkot"]
VEHICLE_TYPES = ["Van", "Truck", "Mini"]

TODAY = date.today()


def build_vehicles():
    vehicles = []

    # Required example vehicle from the PDF workflow
    vehicles.append(dict(
        registration_number="GJ01AB1235",
        name="Van-05",
        type="Van",
        max_load_capacity_kg=500,
        odometer=150,
        acquisition_cost=620000,
        region="Gandhinagar",
        status="Available",
    ))

    # 41 more Available (42 total)
    for i in range(41):
        vehicles.append(dict(
            registration_number=f"GJ01AV{1000+i}",
            name=f"Van-{i+6:02d}" if i % 3 else f"Truck-{i+6:02d}",
            type=random.choice(VEHICLE_TYPES),
            max_load_capacity_kg=random.choice([500, 750, 1000, 5000]),
            odometer=random.randint(500, 80000),
            acquisition_cost=random.choice([450000, 620000, 1850000, 2400000]),
            region=random.choice(REGIONS),
            status="Available",
        ))

    # 6 On Trip
    for i in range(6):
        vehicles.append(dict(
            registration_number=f"GJ01OT{2000+i}",
            name=f"Truck-{i+50:02d}",
            type=random.choice(VEHICLE_TYPES),
            max_load_capacity_kg=random.choice([500, 750, 5000]),
            odometer=random.randint(1000, 90000),
            acquisition_cost=random.choice([620000, 1850000]),
            region=random.choice(REGIONS),
            status="On Trip",
        ))

    # 5 In Shop
    for i in range(5):
        vehicles.append(dict(
            registration_number=f"GJ01IS{3000+i}",
            name=f"Mini-{i+60:02d}",
            type="Mini",
            max_load_capacity_kg=100,
            odometer=random.randint(1000, 66000),
            acquisition_cost=410000,
            region=random.choice(REGIONS),
            status="In Shop",
        ))

    # 3 Retired
    for i in range(3):
        vehicles.append(dict(
            registration_number=f"GJ01RT{4000+i}",
            name=f"Van-{i+70:02d}",
            type="Van",
            max_load_capacity_kg=500,
            odometer=random.randint(90000, 150000),
            acquisition_cost=540000,
            region=random.choice(REGIONS),
            status="Retired",
        ))

    return vehicles


def build_drivers():
    drivers = []

    # Required example driver from the PDF workflow
    drivers.append(dict(
        name="Alex",
        license_number="DL-88213",
        license_category="LMV",
        license_expiry_date=TODAY + timedelta(days=730),
        contact_number="9876500001",
        safety_score=96,
        status="Available",
    ))

    # 9 more Available (10 total)
    for i in range(9):
        drivers.append(dict(
            name=f"Driver-{i+1:02d}",
            license_number=f"DL-{10000+i}",
            license_category=random.choice(["LMV", "HMV"]),
            license_expiry_date=TODAY + timedelta(days=random.randint(200, 900)),
            contact_number=f"98765{10000+i}"[:10],
            safety_score=random.randint(85, 99),
            status="Available",
        ))

    # 26 On Trip
    for i in range(26):
        drivers.append(dict(
            name=f"Driver-{i+20:02d}",
            license_number=f"DL-{20000+i}",
            license_category=random.choice(["LMV", "HMV"]),
            license_expiry_date=TODAY + timedelta(days=random.randint(100, 900)),
            contact_number=f"98764{20000+i}"[:10],
            safety_score=random.randint(80, 99),
            status="On Trip",
        ))

    # 3 Off Duty
    for i in range(3):
        drivers.append(dict(
            name=f"Driver-{i+50:02d}",
            license_number=f"DL-{30000+i}",
            license_category="LMV",
            license_expiry_date=TODAY + timedelta(days=random.randint(200, 600)),
            contact_number=f"98763{30000+i}"[:10],
            safety_score=random.randint(85, 95),
            status="Off Duty",
        ))

    # 1 Suspended (expired license, matches mockup's "John" example)
    drivers.append(dict(
        name="John",
        license_number="DL-44120",
        license_category="HMV",
        license_expiry_date=TODAY - timedelta(days=140),  # expired
        contact_number="9922000001",
        safety_score=81,
        status="Suspended",
    ))

    return drivers


def build_trips(vehicle_ids, driver_ids):
    trips = []

    # 18 Dispatched (Active Trips)
    for i in range(18):
        v = random.choice(vehicle_ids)
        d = random.choice(driver_ids)
        trips.append(dict(
            source=random.choice(REGIONS) + " Depot",
            destination=random.choice(REGIONS) + " Hub",
            vehicle_id=v,
            driver_id=d,
            cargo_weight_kg=random.randint(100, 450),
            planned_distance_km=random.randint(20, 250),
            final_odometer=None,
            fuel_consumed_liters=None,
            revenue=0,
            status="Dispatched",
            dispatched_at=TODAY,
        ))

    # 9 Draft (Pending Trips)
    for i in range(9):
        trips.append(dict(
            source=random.choice(REGIONS) + " Depot",
            destination=random.choice(REGIONS) + " Hub",
            vehicle_id=None,
            driver_id=None,
            cargo_weight_kg=random.randint(100, 400),
            planned_distance_km=random.randint(20, 200),
            final_odometer=None,
            fuel_consumed_liters=None,
            revenue=0,
            status="Draft",
            dispatched_at=None,
        ))

    # 25 Completed (for analytics/revenue/ROI history)
    for i in range(25):
        v = random.choice(vehicle_ids)
        d = random.choice(driver_ids)
        distance = random.randint(30, 300)
        trips.append(dict(
            source=random.choice(REGIONS) + " Depot",
            destination=random.choice(REGIONS) + " Warehouse",
            vehicle_id=v,
            driver_id=d,
            cargo_weight_kg=random.randint(100, 480),
            planned_distance_km=distance,
            final_odometer=random.randint(1000, 90000),
            fuel_consumed_liters=round(distance / random.uniform(6, 9), 2),
            revenue=random.randint(3000, 25000),
            status="Completed",
            dispatched_at=TODAY - timedelta(days=random.randint(2, 60)),
            completed_at=TODAY - timedelta(days=random.randint(0, 1)),
        ))

    # 3 Cancelled
    for i in range(3):
        trips.append(dict(
            source=random.choice(REGIONS) + " Depot",
            destination=random.choice(REGIONS) + " Hub",
            vehicle_id=None,
            driver_id=None,
            cargo_weight_kg=random.randint(100, 300),
            planned_distance_km=random.randint(20, 150),
            final_odometer=None,
            fuel_consumed_liters=None,
            revenue=0,
            status="Cancelled",
            dispatched_at=TODAY - timedelta(days=random.randint(1, 10)),
        ))

    return trips


SEED_MARKER_REGISTRATION = "GJ01AB1235"  # seeded Van-05 — used to detect a prior run


def already_seeded(conn) -> bool:
    row = conn.execute(
        text("SELECT 1 FROM vehicles WHERE registration_number = :reg"),
        {"reg": SEED_MARKER_REGISTRATION},
    ).first()
    return row is not None


def main():
    with engine.begin() as conn:
        if already_seeded(conn):
            print("⚠️  Seed data already present (found marker vehicle "
                  f"{SEED_MARKER_REGISTRATION}). Skipping — nothing inserted.")
            print("   To force a full reseed, run with --reset (see bottom of file).")
            return

    vehicles = build_vehicles()
    drivers = build_drivers()

    with engine.begin() as conn:
        print(f"Inserting {len(vehicles)} vehicles...")
        vehicle_ids = []
        for v in vehicles:
            row = conn.execute(text("""
                INSERT INTO vehicles
                    (registration_number, name, type, max_load_capacity_kg,
                     odometer, acquisition_cost, region, status)
                VALUES
                    (:registration_number, :name, :type, :max_load_capacity_kg,
                     :odometer, :acquisition_cost, :region, :status)
                RETURNING id
            """), v)
            vehicle_ids.append(row.scalar())

        print(f"Inserting {len(drivers)} drivers...")
        driver_ids = []
        for d in drivers:
            row = conn.execute(text("""
                INSERT INTO drivers
                    (name, license_number, license_category, license_expiry_date,
                     contact_number, safety_score, status)
                VALUES
                    (:name, :license_number, :license_category, :license_expiry_date,
                     :contact_number, :safety_score, :status)
                RETURNING id
            """), d)
            driver_ids.append(row.scalar())

        # vehicle ids currently On Trip / Available, for realistic trip linking
        active_vehicle_ids = vehicle_ids[:47]  # available + on-trip pool
        active_driver_ids = driver_ids[:36]    # available + on-trip pool

        trips = build_trips(active_vehicle_ids, active_driver_ids)

        print(f"Inserting {len(trips)} trips...")
        trip_records = []
        for t in trips:
            completed_at = t.get("completed_at")
            row = conn.execute(text("""
                INSERT INTO trips
                    (source, destination, vehicle_id, driver_id, cargo_weight_kg,
                     planned_distance_km, final_odometer, fuel_consumed_liters,
                     revenue, status, dispatched_at, completed_at)
                VALUES
                    (:source, :destination, :vehicle_id, :driver_id, :cargo_weight_kg,
                     :planned_distance_km, :final_odometer, :fuel_consumed_liters,
                     :revenue, :status, :dispatched_at, :completed_at)
                RETURNING id, vehicle_id, status
            """), {**t, "completed_at": completed_at})
            trip_records.append(row.mappings().one())

        # Maintenance logs for the 5 "In Shop" vehicles (indices 47-51 in vehicle_ids)
        in_shop_ids = vehicle_ids[47:52]
        service_types = ["Oil Change", "Engine Repair", "Tyre Replace", "Brake Service", "General Inspection"]
        print(f"Inserting {len(in_shop_ids)} maintenance logs...")
        for i, vid in enumerate(in_shop_ids):
            conn.execute(text("""
                INSERT INTO maintenance_logs (vehicle_id, service_type, cost, service_date, status)
                VALUES (:vehicle_id, :service_type, :cost, :service_date, :status)
            """), dict(
                vehicle_id=vid,
                service_type=service_types[i % len(service_types)],
                cost=random.choice([2500, 6200, 12000, 18000]),
                service_date=TODAY - timedelta(days=random.randint(0, 10)),
                status="In Shop",
            ))

        # Fuel logs + expenses for completed trips (drives Analytics: efficiency, cost, ROI)
        completed_trips = [t for t in trip_records if t["status"] == "Completed" and t["vehicle_id"]]
        print(f"Inserting fuel logs + expenses for {len(completed_trips)} completed trips...")
        for t in completed_trips:
            liters = round(random.uniform(15, 60), 2)
            conn.execute(text("""
                INSERT INTO fuel_logs (vehicle_id, trip_id, liters, cost, log_date)
                VALUES (:vehicle_id, :trip_id, :liters, :cost, :log_date)
            """), dict(
                vehicle_id=t["vehicle_id"],
                trip_id=t["id"],
                liters=liters,
                cost=round(liters * random.uniform(90, 105), 2),
                log_date=TODAY - timedelta(days=random.randint(0, 5)),
            ))

            if random.random() < 0.6:  # not every trip has tolls/misc
                conn.execute(text("""
                    INSERT INTO expenses (vehicle_id, trip_id, expense_type, amount, expense_date)
                    VALUES (:vehicle_id, :trip_id, :expense_type, :amount, :expense_date)
                """), dict(
                    vehicle_id=t["vehicle_id"],
                    trip_id=t["id"],
                    expense_type=random.choice(["Toll", "Misc"]),
                    amount=random.randint(50, 400),
                    expense_date=TODAY - timedelta(days=random.randint(0, 5)),
                ))

    print("\n✅ Seed complete.")
    print(f"   Vehicles: {len(vehicles)} (42 Available, 6 On Trip, 5 In Shop, 3 Retired)")
    print(f"   Drivers:  {len(drivers)} (10 Available, 26 On Trip, 3 Off Duty, 1 Suspended)")
    print(f"   Trips:    {len(trips)} (18 Dispatched, 9 Draft, 25 Completed, 3 Cancelled)")
    print("\n   Reminder: sign up your 4 demo role accounts via /signup — users table was")
    print("   not seeded here since password hashing must match your backend exactly.")


def reset():
    """Clears all demo data (trips, logs, vehicles, drivers) so seed can run fresh.
    Does NOT touch the users table. Only runs when --reset is passed explicitly."""
    confirm = input(
        "This will DELETE all rows from vehicles, drivers, trips, maintenance_logs, "
        "fuel_logs, and expenses. Type 'yes' to confirm: "
    )
    if confirm.strip().lower() != "yes":
        print("Aborted — no changes made.")
        return

    with engine.begin() as conn:
        for table in ["expenses", "fuel_logs", "maintenance_logs", "trips", "vehicles", "drivers"]:
            conn.execute(text(f"DELETE FROM {table}"))
    print("✅ Tables cleared. Run `python seed.py` again to reseed.")


if __name__ == "__main__":
    import sys
    if "--reset" in sys.argv:
        reset()
    else:
        main()