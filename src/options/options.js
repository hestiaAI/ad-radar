document.addEventListener("DOMContentLoaded", () => {
  browser.storage.local.get(store => {
    document.getElementById("accessors").value = JSON.stringify(store.accessors, null, 2)
  })

  function showError(id, error) {
    document.getElementById(id).textContent = error
  }
  document.getElementById("save").addEventListener("click", () => {
    const accessorsText = document.getElementById("accessors").value
    const successDiv = document.getElementById("save-success")

    showError("accessors-error", "")
    successDiv.style.display = "none"
    if (!accessorsText.trim()) {
      return showError("accessors-error", "Please specify accessors for the instrumented libraries")
    }
    let accessors
    try {
      accessors = JSON.parse(accessorsText)
    } catch (error) {
      return showError("accessors-error", `Malformed accessors: ${error.message}`)
    }
    const missing = _.find(librariesOfInterest, lib => !_.has(accessors, lib), 0)
    if (missing) {
      return showError("accessors-error", `Missing accessors for library "${missing}"`)
    }
    for (const lib of librariesOfInterest) {
      const missingField = _.find(requiredFields, field => !_.has(accessors[lib], field), 0)
      if (missingField) {
        return showError("accessors-error", `Missing field "${missingField}" in ${lib} accessors`)
      }
    }
    for (const lib of librariesOfInterest) {
      for (const field of requiredFields) {
        if (!validateAccessor(accessors[lib][field])) {
          return showError("accessors-error", `Accessor at '${lib} > ${field}' is malformed`)
        }
      }
    }

    browser.storage.local.set({ accessors })
    successDiv.style.display = null
  })
})

