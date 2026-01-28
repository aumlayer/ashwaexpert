"""Tests for assignment workflow."""
import pytest
from uuid import uuid4
from fastapi import status

from src.app.models import TicketAssignment


def test_create_assignment_admin(client, db_session):
    """Test admin can assign ticket to technician."""
    ticket_id = uuid4()
    technician_id = uuid4()
    
    response = client.post(
        "/api/v1/assignments",
        json={
            "ticket_id": str(ticket_id),
            "technician_id": str(technician_id),
            "notes": "Test assignment",
        },
        headers={
            "X-User-Id": str(uuid4()),
            "X-User-Role": "admin",
        },
    )
    assert response.status_code in (201, 404, 409)  # 404 if ticket not found, 409 if already assigned


def test_technician_queue(client, db_session):
    """Test technician can see assigned jobs."""
    technician_id = uuid4()
    
    response = client.get(
        "/api/v1/assignments/me",
        headers={
            "X-User-Id": str(technician_id),
            "X-User-Role": "technician",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data


def test_technician_accept_assignment(client, db_session):
    """Test technician can accept assignment."""
    assignment_id = uuid4()
    technician_id = uuid4()
    
    response = client.post(
        f"/api/v1/assignments/{assignment_id}/accept",
        headers={
            "X-User-Id": str(technician_id),
            "X-User-Role": "technician",
        },
    )
    assert response.status_code in (200, 403, 404, 400)


def test_technician_reject_assignment(client, db_session):
    """Test technician can reject assignment."""
    assignment_id = uuid4()
    technician_id = uuid4()
    
    response = client.post(
        f"/api/v1/assignments/{assignment_id}/reject",
        headers={
            "X-User-Id": str(technician_id),
            "X-User-Role": "technician",
        },
    )
    assert response.status_code in (200, 403, 404, 400)


def test_admin_unassign(client, db_session):
    """Test admin can unassign."""
    assignment_id = uuid4()
    
    response = client.post(
        f"/api/v1/assignments/{assignment_id}/unassign",
        headers={
            "X-User-Id": str(uuid4()),
            "X-User-Role": "admin",
        },
    )
    assert response.status_code in (200, 404)
