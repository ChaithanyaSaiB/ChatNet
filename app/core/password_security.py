from passlib.context import CryptContext

# Create a password context using bcrypt, which is a strong hashing algorithm
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password.
    
    :param plain_password: The plain text password to verify
    :param hashed_password: The hashed password to compare against
    :return: True if the password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Generate a hash for a given password.
    
    :param password: The plain text password to hash
    :return: The hashed password
    """
    return pwd_context.hash(password)
