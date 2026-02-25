class AddMbtiToProfiles < ActiveRecord::Migration[8.1]
  def change
    add_column :profiles, :mbti, :string, limit: 4, after: :personality
    add_index :profiles, :mbti
  end
end
