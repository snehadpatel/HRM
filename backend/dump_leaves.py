import os
import django
import json
from django.core.serializers.json import DjangoJSONEncoder

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dayflow.settings')
django.setup()

from leaves.models import LeaveRequest

def dump_leaves():
    requests = LeaveRequest.objects.all().values(
        'id', 'employee__user__email', 'status', 'start_date', 'end_date'
    )
    print(json.dumps(list(requests), cls=DjangoJSONEncoder, indent=2))

if __name__ == "__main__":
    dump_leaves()
