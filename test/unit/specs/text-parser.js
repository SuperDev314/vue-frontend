describe('Text Parser', function () {

    var TextParser = require('vue/src/text-parser')

    describe('.parse()', function () {

        var tokens, badTokens

        before(function () {
            tokens = TextParser.parse('hello {{a}}! {{ bcd }}{{d.e.f}} {{a + (b || c) ? d : e}} {{>test}}{{{ a + "<em>" }}}')
            badTokens = TextParser.parse('{{{a}}{{{{{{{{b}}}}')
        })
        
        it('should return null if no interpolate tags are present', function () {
            var result = TextParser.parse('hello no tags')
            assert.strictEqual(result, null)
        })

        it('should ignore escaped tags', function () {
            var result = TextParser.parse('test {{key}} &#123;&#123;hello&#125;&#125;')
            assert.strictEqual(result.length, 3)
            assert.strictEqual(result[2], ' &#123;&#123;hello&#125;&#125;')
        })
        
        it('should extract correct amount of tokens', function () {
            assert.strictEqual(tokens.length, 10)
        })

        it('should extract plain strings', function () {
            assert.strictEqual(typeof tokens[0], 'string')
            assert.strictEqual(typeof tokens[2], 'string')
            assert.strictEqual(typeof tokens[5], 'string')
            assert.strictEqual(typeof tokens[7], 'string')
        })

        it('should extract basic keys', function () {
            assert.strictEqual(tokens[1].key, 'a')
        })

        it('should trim extracted keys', function () {
            assert.strictEqual(tokens[3].key, 'bcd')
        })

        it('should extract nested keys', function () {
            assert.strictEqual(tokens[4].key, 'd.e.f')
        })

        it('should extract expressions', function () {
            assert.strictEqual(tokens[6].key, 'a + (b || c) ? d : e')
        })

        it('should extract partials', function () {
            assert.strictEqual(tokens[8].key, '>test')
        })

        it('should extract triple mustache (html instead of text)', function () {
            assert.strictEqual(tokens[9].key, 'a + "<em>"')
            assert.ok(tokens[9].html)
        })

        it('should deal with bad binding tags', function () {
            assert.strictEqual(badTokens.length, 4)
            assert.strictEqual(badTokens[0].key, 'a')
            assert.notOk(badTokens[0].html)
            assert.strictEqual(badTokens[1], '{{{{{')
            assert.strictEqual(badTokens[2].key, 'b')
            assert.ok(badTokens[2].html)
            assert.strictEqual(badTokens[3], '}')
        })

    })

    describe('.parseAttr()', function () {
    
        it('should return Directive.parse friendly expression', function () {
            assert.strictEqual(TextParser.parseAttr('{{msg}}'), 'msg')
            assert.strictEqual(TextParser.parseAttr('{{msg + "123"}}'), 'msg + "123"')
            assert.strictEqual(TextParser.parseAttr('ha {{msg + "123"}} ho'), '"ha "+msg + "123"+" ho"')
        })

    })

})