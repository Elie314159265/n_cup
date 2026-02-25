class CreateMessages < ActiveRecord::Migration[8.1]
  def change
    create_table :messages do |t|
      t.references :conversation, null: false, foreign_key: true
      t.bigint :sender_id, null: false
      t.string :message_type, null: false, limit: 20
      t.text :content
      t.json :metadata
      t.timestamp :read_at

      t.timestamps
    end

    add_foreign_key :messages, :users, column: :sender_id
    add_index :messages, [ :conversation_id, :created_at ]
  end
end
