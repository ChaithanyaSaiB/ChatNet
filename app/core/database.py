from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Configure the SQLAlchemy engine using the database URL from environment variables
engine = create_engine(os.environ["DATABASE_URL"])

# Create a session factory bound to the engine
SessionLocal = sessionmaker(bind=engine)

# Base class for declarative models
Base = declarative_base()

# Dependency to provide a database session for request handling
def get_db():
    db = SessionLocal()
    try:
        yield db  # Yield the session for use in the request lifecycle
    finally:
        db.close()  # Ensure the session is closed after use
