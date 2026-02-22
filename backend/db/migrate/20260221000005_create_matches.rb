class CreateMatches < ActiveRecord::Migration[8.1]
  def change
    create_table :matches do |t|
      t.bigint :user_id_1, null: false
      t.bigint :user_id_2, null: false
      t.string :status, null: false, limit: 20, default: 'pending'
      t.timestamp :matched_at

      t.timestamps
    end

    add_foreign_key :matches, :users, column: :user_id_1
    add_foreign_key :matches, :users, column: :user_id_2
    add_index :matches, [:user_id_1, :user_id_2], unique: true
    add_index :matches, :status
  end
end
