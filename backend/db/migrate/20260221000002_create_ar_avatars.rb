class CreateArAvatars < ActiveRecord::Migration[8.1]
  def change
    create_table :ar_avatars do |t|
      t.references :user, null: false, foreign_key: true, index: true
      t.string :name, null: false, limit: 100
      t.string :model_url, null: false, limit: 500
      t.string :texture_url, limit: 500
      t.json :animation_data
      t.json :customization
      t.string :voice_id, limit: 50

      t.timestamps
    end
  end
end
