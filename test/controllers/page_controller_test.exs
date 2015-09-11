defmodule Pixelwall.PageControllerTest do
  use Pixelwall.ConnCase

  test "GET /" do
    conn = get conn(), "/"
    assert html_response(conn, 200) =~ "pixelwall"
  end
end
