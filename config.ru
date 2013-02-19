use Rack::Static, 
  :urls => ["/img", "/lib", "/src"],
  :root => "public"
  
use Rack::Auth::Basic, "Restricted Area" do |username, password|
  [username, password] == ['cityhall', 'broad&mkt']
end

run lambda { |env|
  [
    200, 
    {
      'Content-Type'  => 'text/html', 
      'Cache-Control' => 'public, max-age=86400' 
    },
    File.open('public/index.html', File::RDONLY)
  ]
}