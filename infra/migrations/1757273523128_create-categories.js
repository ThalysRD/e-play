exports.up = (pgm) => {
  pgm.createTable("categories", {
    id: "id",
    name: {
      type: "varchar(255)",
      notNull: true,
      unique: true,
    },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  pgm.sql(`
    INSERT INTO categories (name) VALUES
    ('Ação'),
    ('Aventura'),
    ('Estratégia'),
    ('RPG'),
    ('Esportes'),
    ('Simulação'),
    ('Consoles'),
    ('Acessórios'),
    ('Colecionáveis');
  `);
};

exports.down = (pgm) => {
  pgm.dropTable("categories");
};
