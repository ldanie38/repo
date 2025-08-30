# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models


class Images(models.Model):
    user = models.ForeignKey('Users', models.DO_NOTHING)
    url = models.CharField(max_length=2048)
    filename = models.CharField(max_length=255)
    created_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'images'


class MessageBlocks(models.Model):
    message_group = models.ForeignKey('MessageGroups', models.DO_NOTHING)
    block_order = models.IntegerField()
    block_type = models.CharField(max_length=50)
    text_value = models.TextField(blank=True, null=True)
    segment = models.ForeignKey('Segments', models.DO_NOTHING, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'message_blocks'
        unique_together = (('message_group', 'block_order'),)


class MessageGroups(models.Model):
    user = models.ForeignKey('Users', models.DO_NOTHING)
    title = models.CharField(max_length=255)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'message_groups'


class Posts(models.Model):
    user = models.ForeignKey('Users', models.DO_NOTHING)
    image = models.ForeignKey(Images, models.DO_NOTHING, blank=True, null=True)
    title = models.CharField(max_length=255)
    content = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'posts'


class PushSubscriptions(models.Model):
    user = models.ForeignKey('Users', models.DO_NOTHING)
    endpoint = models.CharField(max_length=2048)
    p256dh_key = models.CharField(max_length=255)
    auth_key = models.CharField(max_length=255)
    created_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'push_subscriptions'
        unique_together = (('user', 'endpoint'),)


class Segments(models.Model):
    user = models.ForeignKey('Users', models.DO_NOTHING)
    title = models.CharField(max_length=255)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'segments'


class Users(models.Model):
    email = models.CharField(unique=True, max_length=255)
    password_hash = models.CharField(max_length=255)
    status = models.CharField(max_length=50)
    password_reset_token = models.CharField(max_length=255, blank=True, null=True)
    password_reset_expires = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'users'
