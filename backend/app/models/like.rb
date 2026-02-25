class Like < ApplicationRecord
  belongs_to :from_user, class_name: "User"
  belongs_to :to_user, class_name: "User"

  validates :from_user_id, uniqueness: { scope: :to_user_id }
  validate :cannot_like_self

  private

  def cannot_like_self
    errors.add(:to_user_id, "cannot like yourself") if from_user_id == to_user_id
  end
end
