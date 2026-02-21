class CreateProfiles < ActiveRecord::Migration[8.1]
  def change
    create_table :profiles do |t|
      t.references :user, null: false, foreign_key: true, index: true
      t.string :display_name, null: false, limit: 100
      t.text :bio
      t.integer :age, null: false
      t.string :gender, null: false, limit: 10
      t.string :location, limit: 100
      t.string :avatar_url, limit: 500
      t.references :ar_avatar, foreign_key: true
      t.string :cup_size, limit: 10
      t.string :personality, limit: 50
      t.json :interests
      t.json :preferences

      t.timestamps
    end

    add_index :profiles, :gender
  end
end
