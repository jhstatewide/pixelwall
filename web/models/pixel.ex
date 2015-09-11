defmodule Pixelwall.Pixel do
  use Ecto.Model
  import Ecto.Query
  @primary_key {:id, :binary_id, autogenerate: true}
  schema "pixels" do
    field :x, :integer
    field :y, :integer
    field :color
    field :wall_id, :binary_id
  end

  def from_row(query, y) do
      from p in query,
      where: p.y == ^y,
      order_by: :y
  end

  def from_wall(query, wall) do
    from p in query,
    where: p.wall_id == ^wall.id
  end

end

defimpl Poison.Encoder, for: Pixelwall.Pixel do
  def encode(model, opts) do
    model
      |> Map.take([:x, :y, :color])
      |> Poison.Encoder.encode(opts)
  end
end
