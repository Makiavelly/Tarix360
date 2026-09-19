package domain

// Coordinates is a geographic point in WGS84.
type Coordinates struct {
	Latitude  float64 `json:"lat"`
	Longitude float64 `json:"lng"`
}

// Hotspot anchors a historical clue to a point inside an equirectangular panorama.
type Hotspot struct {
	ID          string  `json:"id"`
	Title       string  `json:"title"`
	Kind        string  `json:"kind"`
	Description string  `json:"description"`
	Yaw         float64 `json:"yaw"`
	Pitch       float64 `json:"pitch"`
}

// AlternatePanorama is another historical view of the same place.
type AlternatePanorama struct {
	Year        int    `json:"year"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Panorama    string `json:"panorama"`
}

// Event is a historical scene used as a game round.
type Event struct {
	ID                 string              `json:"id"`
	Title              string              `json:"title"`
	Subtitle           string              `json:"subtitle"`
	Year               int                 `json:"year"`
	Place              string              `json:"place"`
	Coordinates        Coordinates         `json:"coordinates"`
	Description        string              `json:"description"`
	Panorama           string              `json:"panorama"`
	SourceTitle        string              `json:"sourceTitle"`
	SourceURL          string              `json:"sourceUrl"`
	Hotspots           []Hotspot           `json:"hotspots"`
	AlternatePanoramas []AlternatePanorama `json:"alternatePanoramas,omitempty"`
}
