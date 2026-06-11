require "test_helper"

class AdminUserTest < ActiveSupport::TestCase
  test "creates with username + password" do
    user = AdminUser.new(username: "owner", password: "longenough1", password_confirmation: "longenough1")
    assert user.save, user.errors.full_messages.to_sentence
  end

  test "requires username" do
    user = AdminUser.new(password: "longenough1", password_confirmation: "longenough1")
    assert_not user.save
    assert_includes user.errors[:username], "can't be blank"
  end

  test "requires unique username" do
    AdminUser.create!(username: "owner", password: "longenough1", password_confirmation: "longenough1")
    dup = AdminUser.new(username: "owner", password: "anotherone1", password_confirmation: "anotherone1")
    assert_not dup.save
    assert_includes dup.errors[:username], "has already been taken"
  end

  test "rejects password shorter than 8" do
    user = AdminUser.new(username: "owner", password: "short", password_confirmation: "short")
    assert_not user.save
    assert_includes user.errors[:password].first, "too short"
  end

  test "stores password as digest, never plaintext" do
    user = AdminUser.create!(username: "owner", password: "longenough1", password_confirmation: "longenough1")
    refute_equal "longenough1", user.password_digest
    assert user.password_digest.present?
  end

  test "authenticate returns user on correct password" do
    user = AdminUser.create!(username: "owner", password: "longenough1", password_confirmation: "longenough1")
    assert_equal user, user.authenticate("longenough1")
  end

  test "authenticate returns false on wrong password" do
    user = AdminUser.create!(username: "owner", password: "longenough1", password_confirmation: "longenough1")
    refute user.authenticate("wrongpassword1")
  end
end
