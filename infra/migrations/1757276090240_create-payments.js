exports.up = (pgm) => {
  // Remover tabela antiga se existir (com estrutura diferente)
  pgm.sql(`DROP TABLE IF EXISTS payments CASCADE;`);

  // Criar tabela nova com a estrutura correta
  pgm.createTable("payments", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    buyer_id: {
      type: "uuid",
      notNull: true,
      references: '"users"(id)',
    },
    order_id: {
      type: "uuid",
      notNull: true,
      references: '"orders"(id)',
      unique: true,
    },
    preference_id: {
      type: "varchar(255)",
      notNull: true,
    },
    external_reference: {
      type: "varchar(255)",
    },
    amount: {
      type: "numeric",
      notNull: true,
    },
    status: {
      type: "varchar(50)",
      notNull: true,
      default: "pending",
    },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
  });

  pgm.createIndex("payments", "buyer_id");
  pgm.createIndex("payments", "order_id");
  pgm.createIndex("payments", "preference_id");
};

exports.down = (pgm) => {
  pgm.dropTable("payments", { ifExists: true });
};
