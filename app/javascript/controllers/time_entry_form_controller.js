import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["taskSelect", "description", "duration", "startTime", "endTime", "formPanel"]
  static values = { recentDescriptionUrl: String }

  toggle() {
    this.formPanelTarget.classList.toggle("hidden")
  }

  onTaskChange() {
    const taskId = this.taskSelectTarget.value
    if (!taskId || !this.hasDescriptionTarget) return
    if (this.descriptionTarget.value.trim()) return  // don't overwrite existing text

    const url = new URL(this.recentDescriptionUrlValue)
    url.searchParams.set("task_id", taskId)

    fetch(url.toString(), { headers: { Accept: "application/json" } })
      .then(r => r.json())
      .then(data => {
        if (data.description && !this.descriptionTarget.value.trim()) {
          this.descriptionTarget.value = data.description
        }
      })
      .catch(() => {})
  }
}
