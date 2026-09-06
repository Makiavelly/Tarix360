package domain

// Coordinates is a geographic point in WGS84.
type Coordinates struct {
	Latitude  float64 `json:"lat"`
	Longitude float64 `json:"lng"`
}

// Event is a historical scene used as a game round.
type Event struct {
	ID          string      `json:"id"`
	Title       string      `json:"title"`
	Subtitle    string      `json:"subtitle"`
	Year        int         `json:"year"`
	Place       string      `json:"place"`
	Coordinates Coordinates `json:"coordinates"`
	Description string      `json:"description"`
	Panorama    string      `json:"panorama"`
	SourceTitle string      `json:"sourceTitle"`
	SourceURL   string      `json:"sourceUrl"`
}
