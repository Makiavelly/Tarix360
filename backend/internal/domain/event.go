package domain

type EventType string

const (
	EventTypeHistory EventType = "history"
	EventTypeLegend  EventType = "legend"
	EventTypeCulture EventType = "culture"
)

// Coordinates is a geographic point in WGS84.
type Coordinates struct {
	Latitude  float64 `json:"lat"`
	Longitude float64 `json:"lng"`
}

// Hotspot anchors a historical clue to a point inside an equirectangular panorama.
type Hotspot struct {
	ID             string  `json:"id"`
	Title          string  `json:"title"`
	TitleTt        string  `json:"titleTt,omitempty"`
	Kind           string  `json:"kind"`
	Image          string  `json:"image"`
	ImageSourceURL string  `json:"imageSourceUrl,omitempty"`
	ImageCredit    string  `json:"imageCredit,omitempty"`
	Description    string  `json:"description"`
	DescriptionTt  string  `json:"descriptionTt,omitempty"`
	Yaw            float64 `json:"yaw"`
	Pitch          float64 `json:"pitch"`
}

// AlternatePanorama is another historical view of the same place.
type AlternatePanorama struct {
	Year          int    `json:"year"`
	Title         string `json:"title"`
	TitleTt       string `json:"titleTt,omitempty"`
	Description   string `json:"description"`
	DescriptionTt string `json:"descriptionTt,omitempty"`
	Panorama      string `json:"panorama"`
}

// Event is a historical scene used as a game round.
type Event struct {
	ID                 string              `json:"id"`
	Type               EventType           `json:"type"`
	Title              string              `json:"title"`
	TitleTt            string              `json:"titleTt,omitempty"`
	Subtitle           string              `json:"subtitle"`
	SubtitleTt         string              `json:"subtitleTt,omitempty"`
	Year               int                 `json:"year"`
	Place              string              `json:"place"`
	PlaceTt            string              `json:"placeTt,omitempty"`
	Coordinates        Coordinates         `json:"coordinates"`
	Description        string              `json:"description"`
	DescriptionTt      string              `json:"descriptionTt,omitempty"`
	Panorama           string              `json:"panorama"`
	SourceTitle        string              `json:"sourceTitle"`
	SourceURL          string              `json:"sourceUrl"`
	Hotspots           []Hotspot           `json:"hotspots"`
	AlternatePanoramas []AlternatePanorama `json:"alternatePanoramas,omitempty"`
}
