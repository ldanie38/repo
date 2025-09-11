from crm.models import Tag, PipelineStage

def run():
    Tag.objects.get_or_create(name="VIP", color="#FFD700")
    Tag.objects.get_or_create(name="Birthday Soon", color="#FF69B4")
    Tag.objects.get_or_create(name="Needs Follow-up", color="#1E90FF")

    PipelineStage.objects.get_or_create(name="New", order=1)
    PipelineStage.objects.get_or_create(name="Contacted", order=2)
    PipelineStage.objects.get_or_create(name="Qualified", order=3)
    PipelineStage.objects.get_or_create(name="Won", order=4)
    PipelineStage.objects.get_or_create(name="Lost", order=5)

    print("Seeded tags and pipeline stages.")
