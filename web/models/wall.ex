defmodule Pixelwall.Wall do
  require Logger
  import Ecto.Query

  @default_color "#FFFFFF"

  use Ecto.Model
  @primary_key {:id, :binary_id, autogenerate: true}
  schema "walls" do
    field :name
    field :pixels, :map, virtual: true, default: Map.new
    timestamps
  end

  def lookup_wall(wall_name) do
    Pixelwall.Repo.get_by(Pixelwall.Wall, name: wall_name) || Pixelwall.Repo.insert!(%Pixelwall.Wall{name: wall_name})
  end

  def load_pixels(wall) do
    if wall.id do
      new_pixels = Pixelwall.Repo.all(Pixelwall.Pixel, wall_id: wall.id) |> Enum.into(Map.new, fn(pixel) ->
        {coord_key(pixel.x, pixel.y), pixel}
      end)
      %{wall | pixels: new_pixels}
    else
      wall
    end
  end

  defp blank_pixel(wall, x, y) do
    %Pixelwall.Pixel{x: x, y: y, color: @default_color, wall_id: wall.id}
  end

  def get_pixel_from_database(wall, x, y) do
    Pixelwall.Repo.get_by(Pixelwall.Pixel, wall_id: wall.id, x: x, y: y)
  end

  defp coord_key(x, y) do
    "#{x},#{y}"
  end

  def get(wall, x, y) do
    # try to get pixel at x, y with wall_id equal...
    wall.pixels[coord_key(x, y)] || blank_pixel(wall, x, y)
  end

  def get_row(wall, start_x, end_x, row) do
    filled_in_pixels = Enum.map(start_x..end_x, fn(x) -> [x, row] end)
    |> Enum.map(fn(coord) ->
        [x,y] = coord
        possible_pixel = Pixelwall.Wall.get(wall, x, y)
        possible_pixel || blank_pixel(wall, x, y)
    end)

    # ok, here's the key... this doesn't work until existing_pixels length == end_x - start_x
    if length(filled_in_pixels) < end_x - start_x do
      raise "Row length #{length(filled_in_pixels)} too short! Expected: #{end_x - start_x}"
    end
    filled_in_pixels
  end

  def save_pixel(pixel) do
    if pixel.id do
        Pixelwall.Repo.update!(pixel)
    else
        Pixelwall.Repo.insert!(pixel)
    end
  end

  def save(wall) do
    if wall.id do
      Pixelwall.Repo.update!(wall)
    else
      Pixelwall.Repo.insert!(wall)
    end
  end

  def save_pixels(wall) do
    Enum.each(wall.pixels, fn({coord, p}) -> save_pixel(p) end)
    wall |> Pixelwall.Wall.load_pixels
  end

  def pixel_count(wall) do
    Map.size(wall.pixels)
  end

  def put(wall, x, y, color) do
    pixel = get(wall, x, y) || %Pixelwall.Pixel{x: x, y: y, color: color, wall_id: wall.id}
    if (pixel.color != color) do
      pixel = %{pixel | color: color}
      %{wall | pixels: Map.put(wall.pixels, coord_key(x, y), pixel)}
    else
      wall
    end
  end

  defp block_pixels(x1, y1, x2, y2) do
    Enum.flat_map(y1..y2, fn(y) ->
      Enum.map(x1..x2, fn(x) ->
        [x: x, y: y]
      end)
    end)
  end

  def get_block(wall, x1, y1, x2, y2) do
    Enum.map(block_pixels(x1, y1, x2, y2), fn(coord) ->
      if (wall.id) do
        get(wall, coord[:x], coord[:y])
      else
        blank_pixel(wall, coord[:x], coord[:y])
      end
    end)
  end

end
