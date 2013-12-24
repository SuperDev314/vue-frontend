casper.test.begin('Sharing Data between VMs', 7, function (test) {
    
    casper
    .start('./fixtures/share-data.html')
    .then(function () {

        test.assertSelectorHasText('#a', 'hello')
        test.assertSelectorHasText('#b', 'hello')
        test.assertField('input', 'hello')
        test.assertSelectorHasText('#d pre', '{"msg":"hello"}')

    })
    .then(function () {
        this.fill('#c', {
            input: 'durrr'
        })
    })
    .then(function () {

        test.assertSelectorHasText('#a', 'durrr')
        test.assertSelectorHasText('#b', 'durrr')
        test.assertSelectorHasText('#d pre', '{"msg":"durrr"}')

    })
    .run(function () {
        test.done()
    })

})