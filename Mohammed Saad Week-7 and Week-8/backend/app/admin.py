from sqlalchemy import func
from .models import Shoutout, User

class AdminService:
    @staticmethod
    def get_dashboard_stats(db):
        top_contributors = db.query(
            User.name, 
            func.count(Shoutout.id).label('post_count')
        ).join(Shoutout, User.id == Shoutout.sender_id).group_by(User.id).all()
        
        return top_contributors

    @staticmethod
    def get_flagged_content(db):
        return db.query(Shoutout).filter(Shoutout.is_reported == True).all()

    @staticmethod
    def export_analytics_data(db):
        stats = AdminService.get_dashboard_stats(db)
        return [{"name": s.name, "count": s.post_count} for s in stats]