defmodule Pixelwall.WallController do
  use Pixelwall.Web, :controller

  defp wall_server(name) do
    {:ok, registry} = Pixelwall.WallServerRegistry.start_link
    wall_server = registry |> Pixelwall.WallServerRegistry.lookup(name)
    wall_server
  end

  def pixel(conn, params) do
    name = Map.get(params, "name")
    x = Map.get(params, "x")
    y = Map.get(params, "y")
    pixel = wall_server(name) |> Pixelwall.WallServer.get(x, y)
    json conn, pixel
  end

  def row(conn, params) do
    name = Map.get(params, "name")
    row_number = Map.get(params, "row") |> Pixelwall.Utils.to_integer
    start_x = Map.get(params, "start_x") |> Pixelwall.Utils.to_integer
    end_x = Map.get(params, "end_x") |> Pixelwall.Utils.to_integer
    wall = wall_server(name) |> Pixelwall.WallServer.wall()
    pixels = wall |> Pixelwall.Wall.get_row(start_x, end_x, row_number)
    colors = pixels |> Enum.map(fn(p) -> p.color end) |> Enum.reverse
    json conn, colors
  end
end
