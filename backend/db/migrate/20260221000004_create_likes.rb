class CreateLikes < ActiveRecord::Migration[8.1]
  def change
    create_table :likes do |t|
      t.bigint :from_user_id, null: false
      t.bigint :to_user_id, null: false

      t.timestamps
    end

    add_foreign_key :likes, :users, column: :from_user_id
    add_foreign_key :likes, :users, column: :to_user_id
    add_index :likes, [ :from_user_id, :to_user_id ], unique: true
  end
end
