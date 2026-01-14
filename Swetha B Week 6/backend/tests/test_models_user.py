import pytest
from sqlalchemy.exc import IntegrityError
from app.models import User, UserRole

def test_create_user(db_session):
    user = User(
        name="Test User",
        email="test@example.com",
        password="hashedpassword",
        role=UserRole.EMPLOYEE
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    assert user.id is not None
    assert user.email == "test@example.com"
    assert user.role == UserRole.EMPLOYEE

def test_create_user_duplicate_email(db_session):
    user1 = User(
        name="User One",
        email="duplicate@example.com",
        password="password",
        role=UserRole.EMPLOYEE
    )
    db_session.add(user1)
    db_session.commit()

    user2 = User(
        name="User Two",
        email="duplicate@example.com",
        password="password",
        role=UserRole.ADMIN
    )
    db_session.add(user2)
    
    with pytest.raises(IntegrityError):
        db_session.commit()

def test_default_role_is_employee(db_session):
    user = User(
        name="No Role User",
        email="norole@example.com",
        password="password"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    assert user.role == UserRole.EMPLOYEE
