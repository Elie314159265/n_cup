class Profile < ApplicationRecord
  belongs_to :user
  belongs_to :ar_avatar, optional: true

  GENDERS = %w[male female other].freeze
  CUP_SIZES = %w[A B C D E F G H I J].freeze

  validates :display_name, presence: true, length: { maximum: 100 }
  validates :age, presence: true, numericality: { only_integer: true, greater_than: 0, less_than: 150 }
  validates :gender, presence: true, inclusion: { in: GENDERS }
  validates :cup_size, inclusion: { in: CUP_SIZES }, allow_nil: true
  validates :personality, length: { maximum: 50 }, allow_nil: true
end
