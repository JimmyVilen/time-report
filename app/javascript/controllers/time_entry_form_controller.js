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

  onStartTimeChange() {
    const startMins = this.#parseTimeToMinutes(this.startTimeTarget.value)
    if (startMins === null) return

    if (this.hasEndTimeTarget && this.endTimeTarget.value.trim()) {
      const endMins = this.#parseTimeToMinutes(this.endTimeTarget.value)
      if (endMins === null || endMins <= startMins) return
      this.durationTarget.value = this.#formatMinutesToDuration(endMins - startMins)
    } else {
      const durationMins = this.#parseDurationToMinutes(this.durationTarget.value)
      if (durationMins === null) return
      if (this.hasEndTimeTarget) {
        this.endTimeTarget.value = this.#formatMinutesToTime(startMins + durationMins)
      }
    }
  }

  onEndTimeChange() {
    const endMins = this.#parseTimeToMinutes(this.endTimeTarget.value)
    if (endMins === null) return

    if (this.hasStartTimeTarget && this.startTimeTarget.value.trim()) {
      const startMins = this.#parseTimeToMinutes(this.startTimeTarget.value)
      if (startMins === null || endMins <= startMins) return
      this.durationTarget.value = this.#formatMinutesToDuration(endMins - startMins)
    } else {
      const durationMins = this.#parseDurationToMinutes(this.durationTarget.value)
      if (durationMins === null) return
      const startMins = endMins - durationMins
      if (startMins < 0) return
      if (this.hasStartTimeTarget) {
        this.startTimeTarget.value = this.#formatMinutesToTime(startMins)
      }
    }
  }

  #parseDurationToMinutes(str) {
    if (!str) return null
    let total = 0
    const regex = /(\d+(?:\.\d+)?)\s*(h|m)/gi
    let match
    while ((match = regex.exec(str)) !== null) {
      const n = parseFloat(match[1])
      total += match[2].toLowerCase() === 'h' ? n * 60 : n
    }
    return total > 0 ? Math.round(total) : null
  }

  #parseTimeToMinutes(str) {
    if (!str || !/^\d{2}:\d{2}$/.test(str)) return null
    const [h, m] = str.split(':').map(Number)
    return h * 60 + m
  }

  #formatMinutesToDuration(totalMinutes) {
    const h = Math.floor(totalMinutes / 60)
    const m = totalMinutes % 60
    if (h === 0) return `${m}m`
    if (m === 0) return `${h}h`
    return `${h}h ${m}m`
  }

  #formatMinutesToTime(mins) {
    const h = Math.floor(mins / 60) % 24
    const m = mins % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }
}
