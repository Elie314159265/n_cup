require 'rails_helper'

RSpec.describe Profile, type: :model do
  describe 'バリデーション' do
    it '有効なファクトリー' do
      expect(build(:profile)).to be_valid
    end

    it 'display_nameが必須' do
      expect(build(:profile, display_name: nil)).not_to be_valid
    end

    it 'ageが必須で正の整数' do
      expect(build(:profile, age: nil)).not_to be_valid
      expect(build(:profile, age: 0)).not_to be_valid
      expect(build(:profile, age: -1)).not_to be_valid
    end

    it 'genderが必須でenum値' do
      expect(build(:profile, gender: nil)).not_to be_valid
      expect(build(:profile, gender: 'unknown')).not_to be_valid
    end

    it 'cup_sizeはA〜Jのみ許可' do
      expect(build(:profile, cup_size: 'Z')).not_to be_valid
      expect(build(:profile, cup_size: 'A')).to be_valid
    end

    it 'mbtiは正しい型のみ許可' do
      expect(build(:profile, mbti: 'XXXX')).not_to be_valid
      expect(build(:profile, mbti: 'ENFP')).to be_valid
      expect(build(:profile, mbti: nil)).to be_valid
    end
  end
end
