defmodule Pixelwall.Repo.Migrations.CreatePixelsTable do
  use Ecto.Migration

  def change do

    create table(:walls) do
      add :name, :string
      timestamps
    end

    create table(:pixels) do
      add :x, :integer
      add :y, :integer
      add :color, :string
      add :wall_id, :binary_id
    end

  end
end
