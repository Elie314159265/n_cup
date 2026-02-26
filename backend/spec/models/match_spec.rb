require 'rails_helper'

RSpec.describe Match, type: :model do
  describe 'バリデーション' do
    it '有効なファクトリー' do
      expect(build(:match)).to be_valid
    end

    it 'statusはmatched/pending/rejectedのみ' do
      expect(build(:match, status: 'invalid')).not_to be_valid
    end

    it 'compatibility_scoreは0〜100の整数' do
      expect(build(:match, compatibility_score: -1)).not_to be_valid
      expect(build(:match, compatibility_score: 101)).not_to be_valid
      expect(build(:match, compatibility_score: nil)).to be_valid
    end
  end

  describe 'スコープ' do
    it '.matchedはmatched状態のみ返す' do
      create(:match, status: 'matched', user_1: create(:user), user_2: create(:user))
      create(:match, status: 'pending', user_1: create(:user), user_2: create(:user))
      expect(Match.matched.count).to eq(1)
    end
  end
end
