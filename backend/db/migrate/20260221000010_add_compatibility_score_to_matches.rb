class AddCompatibilityScoreToMatches < ActiveRecord::Migration[8.1]
  def change
    add_column :matches, :compatibility_score, :integer, after: :matched_at
  end
end
