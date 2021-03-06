/**
 * @Class Note
 *
 */
class Note extends EditorChild {
	//  STATE
  editing = false
  text = "Double-click me to edit!"
  editorWidth = 600
  editorHeight = 400

  //  DOM
  backgroundNode
  contentNode
  editorNode

  // Transforms assigned by editor through constructor
  transforms
  
	constructor(x, y, transforms) {
		super(x, y, 0);

		// Note-specific listeners
		this.listenEvents = [
			...this.listenEvents,
      'RefreshNotes',
		]

		this.talkEvents = [
			...this.talkEvents,
		]

    this.transforms = transforms

    this.backgroundNode = createDiv('')
    this.backgroundNode.parent('notes-layer')
    this.backgroundNode.class('note')

    this.contentNode = createDiv(this.text)
    this.contentNode.parent(this.backgroundNode)
    this.contentNode.class('note-content')

    this.editorNode = createElement('textarea')
    this.editorNode.parent(this.backgroundNode)
    this.editorNode.class('note-editor')
    this.editorNode.style('width', this.editorWidth+'px')
    this.editorNode.style('height', this.editorHeight+'px')
    this.editorNode.elt.value = this.text

    new ResizeObserver(this.onResizeEditor.bind(this)).observe(this.editorNode.elt)
    
    // Ensure that mousedown events within the editor do not propagate and thus close out the editing session
    this.editorNode.elt.addEventListener('mousedown', e => e.stopPropagation())
	}

  /**
   * @method onRefreshNotes
   *
   * @param {<Object>}	detail - contains transforms required to correctly position/scale this element
   *
   */
  onRefreshNotes(event) {
    this.refreshTransform()
  }

  /**
   * @method refreshBodySize
   *
   * Align this node's transform with the canvas camera
   */
  refreshTransform() {
    this.refreshBodySize()

    const width = this.bodyWidth
    const height = this.bodyHeight
    const scale = this.transforms.scale
    const aspect = innerWidth/innerHeight

    const [screenX, screenY] = this.transforms.worldToScreen(this.globalX, this.globalY)
    const [frameX, frameY] = this.transforms.worldToFrame(this.globalX, this.globalY)

    const [frameLeft, frameTop] = this.transforms.screenToFrame(screenX-0*width/2, screenY-0*height/2)
    const [frameRight, frameBottom] = this.transforms.screenToFrame(screenX+width/1, screenY+height/1)

    const z = 20*scale
    const offsetX = lerp(0, z, frameX/aspect)
    const offsetY = lerp(0, z, frameY)

    const translateX = screenX-width/2+offsetX
    const translateY = screenY-height/2+offsetY

    const shadowX = -offsetX/scale
    const shadowY = -offsetY/scale
    const shadowBlur = 15
    const shadowColor = 'rgba(32, 32, 32, 0.3)'
    const shadowSpread = 0

    this.backgroundNode.style('transform', `translate(${translateX}px, ${translateY}px) scale(${scale}, ${scale})`)
    this.backgroundNode.style('box-shadow', `${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowSpread}px ${shadowColor}`)
  }

  /**
   * @method refreshBodySize
   *
   * Align this node's body size to its DOM size
   */
  refreshBodySize() {
    const width = this.backgroundNode.elt.offsetWidth
    const height = this.backgroundNode.elt.offsetHeight

    this.bodyWidth = width
    this.bodyHeight = height
  }

  /**
   * @method onSelect
   *
   */
  onSelect(event) {
    super.onSelect(event)

    if (event.detail.id == this.id) {
      this.backgroundNode.addClass('selected')
    }
  }

  /**
   * @method onDeselect
   *
   */
  onDeselect(event) {
    super.onDeselect(event)

    if (event.detail.id == this.id) {
      this.backgroundNode.removeClass('selected')
    }
  }

  /**
   * @method onResizeEditor
   *
   */
   onResizeEditor(event) {
    this.refreshTransform()
  }

  /**
   * @method beginEdit
   *
   * Begin editing this note
   */
  beginEdit() {
    this.editing = true
    this.backgroundNode.addClass('editing')
    this.editorNode.elt.value = this.text

    this.refreshTransform()
  }

  /**
   * @method endEdit
   *
   * End editing this note
   */
  endEdit() {
    this.editing = false

    this.text = this.editorNode.elt.value
    this.editorWidth = this.editorNode.elt.offsetWidth
    this.editorHeight = this.editorNode.elt.offsetHeight

    const converter = new showdown.Converter()
    converter.setOption('tables', true)
    converter.setOption('strikethrough', true)
    const html = converter.makeHtml(this.text)

    this.contentNode.html(html)
    this.backgroundNode.removeClass('editing')

    this.refreshTransform()
  }

  /**
   * @method removeFromEditor
   *
   *  Override EditorChild.removeFromEditor method.
   *
   * @param {<Object>}	editor
   *
   */
  removeFromEditor (editor) {
    super.removeFromEditor(editor)

    this.backgroundNode.remove()
  }

  onOver(detail) {
    super.onOver(detail)

    this.backgroundNode.addClass('over')
  }

  onOut(detail) {
    super.onOut(detail)

    this.backgroundNode.removeClass('over')
  }

	/**
	 * @method serialize
	 * Get a static object representation of this note
	 *
	 * @return {<Object>} the state of this note, serialized to an object
	 */
  serialize() {
    return {
      id: this.id,
      x: this.globalX,
      y: this.globalY,
      text: this.text,
      editorWidth: this.editorWidth,
      editorHeight: this.editorHeight,
    }
  }

	/**
	 * @method deserialize
	 * Restore state from a static object representation of this note
	 *
	 * @param {<Object>} state - the state of this note, serialized to an object
	 */
  deserialize(state) {
    this.setPosition(state.x, state.y)

    this.text = state.text

    const converter = new showdown.Converter()
    converter.setOption('tables', true)
    converter.setOption('strikethrough', true)
    const html = converter.makeHtml(this.text)

    this.contentNode.html(html)

    this.editorNode.style('width', state.editorWidth+'px')
    this.editorNode.style('height', state.editorHeight+'px')

    this.refreshTransform()
  }
}
