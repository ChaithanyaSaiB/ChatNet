from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# SQLAlchemy engine and session configuration
engine = create_engine(os.environ["DATABASE_URL"]) # Add echo=True for verbose of database operations
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()