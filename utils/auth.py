from functools import wraps
from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.users import User


def role_required(required_role):
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            current_user_id = get_jwt_identity()
            try:
                user_id = int(current_user_id)
            except (ValueError, TypeError):
                return jsonify({"success": False, "message": "Invalid token identity."}), 401

            user = User.query.get(user_id)
            if not user:
                return jsonify({"success": False, "message": "User not found."}), 404

            if user.role != required_role:
                return jsonify({
                    "success": False,
                    "message": f"Forbidden: Access restricted to {required_role} role."
                }), 403

            # Pass current_user to route if needed or keep standard
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def get_current_user():
    current_user_id = get_jwt_identity()
    if not current_user_id:
        return None
    try:
        user_id = int(current_user_id)
        return User.query.get(user_id)
    except (ValueError, TypeError):
        return None
