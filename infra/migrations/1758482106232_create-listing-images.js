exports.up = (pgm) => {
  pgm.createTable("listing_images", {
    id: "id",
    listing_id: {
      type: "integer",
      notNull: true,
      references: '"listings"(id)',
      onDelete: "CASCADE",
    },
    image_url: {
      type: "varchar(500)",
      notNull: true,
    },
    display_order: {
      type: "integer",
      notNull: true,
      default: 0,
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

  // Índice para buscar imagens por listing
  pgm.createIndex("listing_images", "listing_id");
};

exports.down = (pgm) => {
  pgm.dropTable("listing_images");
};
