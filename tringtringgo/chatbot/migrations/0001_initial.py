from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Place',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('area', models.CharField(max_length=200, blank=True)),
                ('rating', models.FloatField(default=0.0)),
                ('description', models.TextField(blank=True)),
            ],
        ),
        migrations.CreateModel(
            name='Hospital',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('area', models.CharField(max_length=200, blank=True)),
            ],
        ),
        migrations.CreateModel(
            name='PoliceStation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('area', models.CharField(max_length=200, blank=True)),
            ],
        ),
        migrations.CreateModel(
            name='ATM',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('area', models.CharField(max_length=200, blank=True)),
                ('address', models.CharField(max_length=255, blank=True)),
                ('phone', models.CharField(max_length=50, blank=True)),
                ('open_hours', models.CharField(max_length=120, blank=True)),
            ],
        ),
        migrations.CreateModel(
            name='Pharmacies',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('area', models.CharField(max_length=200, blank=True)),
                ('address', models.CharField(max_length=255, blank=True)),
                ('phone', models.CharField(max_length=50, blank=True)),
                ('open_hours', models.CharField(max_length=120, blank=True)),
            ],
        ),
        migrations.CreateModel(
            name='Transport',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('area', models.CharField(max_length=200, blank=True)),
                ('address', models.CharField(max_length=255, blank=True)),
                ('phone', models.CharField(max_length=50, blank=True)),
                ('open_hours', models.CharField(max_length=120, blank=True)),
                ('notes', models.TextField(blank=True)),
            ],
        ),
        migrations.CreateModel(
            name='ChatMessage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('role', models.CharField(max_length=10, choices=[('user', 'user'), ('bot', 'bot')])),
                ('message', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),
    ]
