defmodule Pixelwall.WallServerTest do
  use Pixelwall.ModelCase

  test "it should be able to start a server" do
    {:ok, wall_server} = Pixelwall.WallServer.start_link(name: "awesome")
    assert(wall_server)
    Pixelwall.WallServer.put!(wall_server, 0, 0, "#FF0000")
    assert(Pixelwall.WallServer.get(wall_server, 0, 0).color ==  "#FF0000")
  end
end

defmodule Pixelwall.WallRegistryTest do
  use Pixelwall.ModelCase

  test "it should be able to use the wallserver registry" do
    {:ok, wall_server_registry} = Pixelwall.WallServerRegistry.start_link
    wall_server = wall_server_registry |> Pixelwall.WallServerRegistry.lookup("1")
    assert(wall_server)
    pixel = wall_server |> Pixelwall.WallServer.get(0, 0)
    assert(pixel.color == "#FFFFFF")
    # now let's try to get the same wall server, hopefully we get the same pid...
    another_server = wall_server_registry |> Pixelwall.WallServerRegistry.lookup("1")
    assert(wall_server == another_server)
    wall_server |> Pixelwall.WallServer.put!(0, 0, "#00FF00")
    assert((wall_server |> Pixelwall.WallServer.get(0,0)).color == "#00FF00")
    pixel1 = wall_server |> Pixelwall.WallServer.get(0, 0)
    pixel2 = another_server |> Pixelwall.WallServer.get(0,0)
    assert(pixel1 == pixel2 && pixel1.color == "#00FF00")
  end

  test "should be able to get the same wall server registry" do
    {:ok, registry1} = Pixelwall.WallServerRegistry.start_link
    {:ok, registry2} = Pixelwall.WallServerRegistry.start_link
    assert(registry1 == registry2)
  end

  test "it should be able to put a circle" do
    {:ok, wall_server_registry} = Pixelwall.WallServerRegistry.start_link
    wall_server = wall_server_registry |> Pixelwall.WallServerRegistry.lookup("2")
    wall_server |> Pixelwall.WallServer.put_circle!(0, 0, "#0000FF", 5)
  end
end
