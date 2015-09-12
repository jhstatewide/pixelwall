defmodule Pixelwall.WallTest do
  use Pixelwall.ModelCase

  test "it should be able to get a new instance of wall and set some pixels" do
    wall = Repo.insert!(%Pixelwall.Wall{name: "test_wall"})
    assert(wall.id)
    assert(Pixelwall.Wall.get(wall, 0, 0).color, "FFFFFF")
    Pixelwall.Wall.put(wall, 0, 0, "000FFF")
    assert(Pixelwall.Wall.get(wall, 0, 0).color, "000FFF")
  end

  test "it should be able to get a whole block of pixels" do
    wall = %Pixelwall.Wall{name: "test_wall"}
    assert(length(Pixelwall.Wall.get_block(wall, 0, 0, 9, 9)) == 100)
  end

  test "it should be able to get a row" do
    wall = %Pixelwall.Wall{name: "test_wall"}
    assert(length(Pixelwall.Wall.get_row(wall, 0, 9, 0)) == 10)
  end

  test "it should be able to generate pixels for a circle" do
    pixels1 = Pixelwall.Wall.circle_pixels(0, 0, 3)
    pixels2 = Pixelwall.Wall.circle_pixels(10, 10, 3)
    assert(length(pixels1) == 29)
    assert(length(pixels2) == 29)
  end
end
